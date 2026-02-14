# DeerFlow 沙箱 Provisioner

**Sandbox Provisioner** 是一个基于 FastAPI 的服务，用于在 Kubernetes 中动态管理沙箱 Pod。它向 DeerFlow 后端提供 REST API，以创建、监控和销毁用于代码执行的隔离沙箱环境。

## 架构

```
┌────────────┐  HTTP  ┌─────────────┐  K8s API  ┌──────────────┐
│  Backend   │ ─────▸ │ Provisioner │ ────────▸ │  Host K8s    │
│  (gateway/ │        │   :8002     │           │  API Server  │
│ langgraph) │        └─────────────┘           └──────┬───────┘
└────────────┘                                          │ 创建
                                                        │
                          ┌─────────────┐         ┌────▼─────┐
                          │   Backend   │ ──────▸ │  Sandbox │
                          │ (via Docker │ NodePort│  Pod(s)  │
                          │   network)  │         └──────────┘
                          └─────────────┘
```

### 工作流程

1. **后端请求**：当后端需要执行代码时，会发送 `POST /api/sandboxes` 请求，并携带 `sandbox_id` 与 `thread_id`。

2. **创建 Pod**：Provisioner 在 `deer-flow` 命名空间创建专用 Pod，包含：
   - 沙箱容器镜像（all-in-one-sandbox）
   - 挂载 HostPath 卷：
     - `/mnt/skills` → 只读访问公共技能
     - `/mnt/user-data` → 可读写访问线程数据
   - 资源限制（CPU、内存、临时存储）
   - 就绪/存活探针

3. **创建 Service**：创建 NodePort Service 暴露 Pod，Kubernetes 自动分配 NodePort（通常范围 30000-32767）。

4. **返回访问地址**：Provisioner 向后端返回 `http://host.docker.internal:{NodePort}`，后端容器可直接访问。

5. **清理**：会话结束后，`DELETE /api/sandboxes/{sandbox_id}` 删除对应 Pod 与 Service。

## 运行要求

宿主机需有可用 Kubernetes 集群（Docker Desktop K8s、OrbStack、minikube、kind 等）。

### 在 Docker Desktop 中启用 Kubernetes
1. 打开 Docker Desktop 设置
2. 进入 “Kubernetes” 标签
3. 勾选 “Enable Kubernetes”
4. 点击 “Apply & Restart”

### 在 OrbStack 中启用 Kubernetes
1. 打开 OrbStack 设置
2. 进入 “Kubernetes” 标签
3. 勾选 “Enable Kubernetes”

## API 端点

### `GET /health`
健康检查端点。

**响应**：
```json
{
  "status": "ok"
}
```

### `POST /api/sandboxes`
创建新的沙箱 Pod + Service。

**请求**：
```json
{
  "sandbox_id": "abc-123",
  "thread_id": "thread-456"
}
```

**响应**：
```json
{
  "sandbox_id": "abc-123",
  "sandbox_url": "http://host.docker.internal:32123",
  "status": "Pending"
}
```

**幂等性**：对同一 `sandbox_id` 重复调用会返回已存在沙箱信息。

### `GET /api/sandboxes/{sandbox_id}`
获取指定沙箱状态与 URL。

**响应**：
```json
{
  "sandbox_id": "abc-123",
  "sandbox_url": "http://host.docker.internal:32123",
  "status": "Running"
}
```

**状态值**：`Pending`、`Running`、`Succeeded`、`Failed`、`Unknown`、`NotFound`

### `DELETE /api/sandboxes/{sandbox_id}`
销毁沙箱 Pod + Service。

**响应**：
```json
{
  "ok": true,
  "sandbox_id": "abc-123"
}
```

### `GET /api/sandboxes`
列出当前由 Provisioner 管理的全部沙箱。

**响应**：
```json
{
  "sandboxes": [
    {
      "sandbox_id": "abc-123",
      "sandbox_url": "http://host.docker.internal:32123",
      "status": "Running"
    }
  ],
  "count": 1
}
```

## 配置

Provisioner 通过环境变量配置（定义在 [docker-compose-dev.yaml](../docker-compose-dev.yaml)）：

| 变量 | 默认值 | 说明 |
|----------|---------|-------------|
| `K8S_NAMESPACE` | `deer-flow` | 沙箱资源所在 Kubernetes 命名空间 |
| `SANDBOX_IMAGE` | `enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest` | 沙箱 Pod 使用的容器镜像 |
| `SKILLS_HOST_PATH` | - | **宿主机**技能目录路径（必须为绝对路径） |
| `THREADS_HOST_PATH` | - | **宿主机**线程数据目录路径（必须为绝对路径） |
| `KUBECONFIG_PATH` | `/root/.kube/config` | Provisioner 容器内 kubeconfig 路径 |
| `NODE_HOST` | `host.docker.internal` | 后端容器访问宿主机 NodePort 的主机名 |
| `K8S_API_SERVER` | （来自 kubeconfig） | 覆盖 K8s API Server 地址（例如 `https://host.docker.internal:26443`） |

### 重要：`K8S_API_SERVER` 覆盖

如果你的 kubeconfig 使用 `localhost`、`127.0.0.1` 或 `0.0.0.0` 作为 API Server 地址（OrbStack/minikube/kind 常见），Provisioner 在 Docker 容器内将**无法**访问。

**解决方案**：将 `K8S_API_SERVER` 设为 `host.docker.internal`：

```yaml
# docker-compose-dev.yaml
provisioner:
  environment:
    - K8S_API_SERVER=https://host.docker.internal:26443  # 将 26443 替换为你的 API 端口
```

查看 kubeconfig 的 API Server：
```bash
kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
```

## 前置条件

### 宿主机要求

1. **Kubernetes 集群**：
   - Docker Desktop（开启 Kubernetes），或
   - OrbStack（内置 K8s），或
   - minikube、kind、k3s 等。

2. **kubectl 已配置**：
   - `~/.kube/config` 必须存在且有效
   - 当前 context 应指向本地集群

3. **Kubernetes 权限**：
   - Provisioner 需要有权限：
     - 在 `deer-flow` 命名空间创建/读取/删除 Pod
     - 在 `deer-flow` 命名空间创建/读取/删除 Service
     - 读取 Namespace（缺失时可创建 `deer-flow`）

4. **Host 路径**：
   - `SKILLS_HOST_PATH` 与 `THREADS_HOST_PATH` 必须是**宿主机绝对路径**
   - 这些路径会通过 K8s HostPath 卷挂载到沙箱 Pod
   - 路径必须存在且 K8s 节点可读

### Docker Compose 部署

Provisioner 作为 docker-compose-dev 栈的一部分运行：

```bash
# 启动全部服务（含 provisioner）
make docker-start

# 或仅启动 provisioner
docker compose -p deer-flow-dev -f docker/docker-compose-dev.yaml up -d provisioner
```

Compose 文件会：
- 将宿主机 `~/.kube/config` 挂载进容器
- 为 `host.docker.internal` 增加 `extra_hosts`（Linux 必需）
- 配置 Kubernetes 访问所需环境变量

## 测试

### 手动 API 测试

```bash
# 健康检查
curl http://localhost:8002/health

# 创建沙箱（通过 provisioner 容器调用，便于使用内部 DNS）
docker exec deer-flow-provisioner curl -X POST http://localhost:8002/api/sandboxes \
  -H "Content-Type: application/json" \
  -d '{"sandbox_id":"test-001","thread_id":"thread-001"}'

# 查看沙箱状态
docker exec deer-flow-provisioner curl http://localhost:8002/api/sandboxes/test-001

# 列出全部沙箱
docker exec deer-flow-provisioner curl http://localhost:8002/api/sandboxes

# 在 K8s 中验证 Pod 和 Service
kubectl get pod,svc -n deer-flow -l sandbox-id=test-001

# 删除沙箱
docker exec deer-flow-provisioner curl -X DELETE http://localhost:8002/api/sandboxes/test-001
```

### 在后端容器中验证连通性

创建沙箱后，后端容器（gateway、langgraph）应可访问该沙箱：

```bash
# 从 provisioner 获取沙箱 URL
SANDBOX_URL=$(docker exec deer-flow-provisioner curl -s http://localhost:8002/api/sandboxes/test-001 | jq -r .sandbox_url)

# 在 gateway 容器中测试
docker exec deer-flow-gateway curl -s $SANDBOX_URL/v1/sandbox
```

## 故障排查

### 问题："Kubeconfig not found"

**原因**：挂载路径上不存在 kubeconfig 文件。

**解决**：
- 确认宿主机存在 `~/.kube/config`
- 运行 `kubectl config view` 验证配置
- 检查 `docker-compose-dev.yaml` 的卷挂载配置

### 问题：连接 K8s API 时 "Connection refused"

**原因**：Provisioner 无法访问 K8s API Server。

**解决**：
1. 检查 kubeconfig 的 server 地址：
   ```bash
   kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
   ```
2. 若为 `localhost` 或 `127.0.0.1`，配置 `K8S_API_SERVER`：
   ```yaml
   environment:
     - K8S_API_SERVER=https://host.docker.internal:PORT
   ```

### 问题：创建 Pod 时 "Unprocessable Entity"

**原因**：HostPath 路径非法（例如带 `..` 的相对路径）。

**解决**：
- `SKILLS_HOST_PATH` 与 `THREADS_HOST_PATH` 使用绝对路径
- 验证宿主机路径存在：
  ```bash
  ls -la /path/to/skills
  ls -la /path/to/backend/.deer-flow/threads
  ```

### 问题：Pod 卡在 "ContainerCreating"

**原因**：通常是沙箱镜像拉取中。

**解决**：
- 预拉取镜像：`make docker-init`
- 查看 Pod 事件：`kubectl describe pod sandbox-XXX -n deer-flow`
- 检查节点状态：`kubectl get nodes`

### 问题：后端无法访问 sandbox URL

**原因**：NodePort 不可达或 `NODE_HOST` 配置错误。

**解决**：
- 验证 Service 存在：`kubectl get svc -n deer-flow`
- 在宿主机测试：`curl http://localhost:NODE_PORT/v1/sandbox`
- 确认 docker-compose 已配置 `extra_hosts`（Linux）
- 检查 `NODE_HOST` 是否与后端访问宿主机的方式一致

## 安全注意事项

1. **HostPath 卷**：Provisioner 会把宿主机目录挂载到沙箱 Pod，请确保这些路径仅包含可信数据。

2. **资源限制**：每个沙箱 Pod 都有 CPU、内存与存储限制，防止资源耗尽。

3. **网络隔离**：沙箱 Pod 在 `deer-flow` 命名空间运行，但通过 NodePort 暴露。若需更严格隔离，请配置 NetworkPolicy。

4. **kubeconfig 访问权限**：Provisioner 通过挂载 kubeconfig 拥有集群访问能力，请仅在可信环境运行。

5. **镜像可信性**：沙箱镜像应来自可信镜像仓库，建议审计镜像内容。

## 后续增强

- [ ] 支持按沙箱自定义资源 request/limit
- [ ] 支持 PersistentVolume 以满足更大数据需求
- [ ] 自动清理过期沙箱（基于超时）
- [ ] 指标与监控（Prometheus 集成）
- [ ] 多集群支持（路由至不同 K8s 集群）
- [ ] Pod 亲和/反亲和策略优化调度
- [ ] 提供 NetworkPolicy 模板实现沙箱隔离
