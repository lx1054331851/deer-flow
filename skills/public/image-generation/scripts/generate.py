import base64
import os
from typing import Any

import requests
from PIL import Image


DEFAULT_GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com"
GOOGLE_IMAGE_ENDPOINT_PATH = "/v1beta/models/gemini-3-pro-image-preview:generateContent"
OPENAI_IMAGE_ENDPOINT_PATH = "/v1/images/generations"


def _build_api_url_and_mode() -> tuple[str, str]:
    """Build API URL and detect protocol mode.

    Modes:
    - google: Gemini native generateContent protocol
    - openai: OpenAI-compatible /v1/images/generations protocol
    """
    mode = os.getenv("GEMINI_API_MODE", "auto").strip().lower()

    full_api_url = os.getenv("GEMINI_API_URL")
    if full_api_url and full_api_url.strip():
        api_url = full_api_url.strip()
    else:
        base_url = (
            os.getenv("GEMINI_API_BASE_URL", DEFAULT_GEMINI_API_BASE_URL)
            .strip()
            .rstrip("/")
        )
        path_from_env = os.getenv("GEMINI_API_PATH", "").strip()

        if path_from_env:
            endpoint_path = (
                path_from_env if path_from_env.startswith("/") else f"/{path_from_env}"
            )
        elif mode == "openai":
            endpoint_path = OPENAI_IMAGE_ENDPOINT_PATH
        elif mode == "google":
            endpoint_path = GOOGLE_IMAGE_ENDPOINT_PATH
        else:
            # auto mode default behavior:
            # - Google official base URL -> google path
            # - custom third-party base URL -> openai-compatible path
            if "generativelanguage.googleapis.com" in base_url:
                endpoint_path = GOOGLE_IMAGE_ENDPOINT_PATH
            else:
                endpoint_path = OPENAI_IMAGE_ENDPOINT_PATH

        api_url = f"{base_url}{endpoint_path}"

    if mode == "auto":
        if "/v1/images/generations" in api_url:
            mode = "openai"
        else:
            mode = "google"

    return api_url, mode


def validate_image(image_path: str) -> bool:
    """
    Validate if an image file can be opened and is not corrupted.

    Args:
        image_path: Path to the image file

    Returns:
        True if the image is valid and can be opened, False otherwise
    """
    try:
        with Image.open(image_path) as img:
            img.verify()  # Verify that it's a valid image
        # Re-open to check if it can be fully loaded (verify() may not catch all issues)
        with Image.open(image_path) as img:
            img.load()  # Force load the image data
        return True
    except Exception as e:
        print(f"Warning: Image '{image_path}' is invalid or corrupted: {e}")
        return False


def generate_image(
    prompt_file: str,
    reference_images: list[str],
    output_file: str,
    aspect_ratio: str = "16:9",
) -> str:
    with open(prompt_file, "r") as f:
        prompt = f.read()
    parts = []
    i = 0

    # Filter out invalid reference images
    valid_reference_images = []
    for ref_img in reference_images:
        if validate_image(ref_img):
            valid_reference_images.append(ref_img)
        else:
            print(f"Skipping invalid reference image: {ref_img}")

    if len(valid_reference_images) < len(reference_images):
        print(
            f"Note: {len(reference_images) - len(valid_reference_images)} reference image(s) were skipped due to validation failure."
        )

    for reference_image in valid_reference_images:
        i += 1
        with open(reference_image, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode("utf-8")
        parts.append(
            {
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_b64,
                }
            }
        )

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "GEMINI_API_KEY is not set"

    api_url, api_mode = _build_api_url_and_mode()
    timeout = int(os.getenv("GEMINI_TIMEOUT", "120"))

    if api_mode == "google":
        response = requests.post(
            api_url,
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "generationConfig": {"imageConfig": {"aspectRatio": aspect_ratio}},
                "contents": [{"parts": [*parts, {"text": prompt}]}],
            },
            timeout=timeout,
        )
    else:
        if valid_reference_images:
            print(
                "Warning: OpenAI-compatible /v1/images/generations usually ignores reference images; they will not be sent."
            )

        model = os.getenv("GEMINI_MODEL", "nano-banana-pro")
        response_format = os.getenv("GEMINI_RESPONSE_FORMAT", "b64_json")
        payload: dict[str, Any] = {
            "prompt": prompt,
            "model": model,
            "response_format": response_format,
        }

        size = os.getenv("GEMINI_SIZE", "").strip()
        if size:
            payload["size"] = size
        if aspect_ratio:
            payload["aspect_ratio"] = aspect_ratio

        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=timeout,
        )

    response.raise_for_status()

    body = response.json()
    if api_mode == "google":
        response_parts: list[dict] = body["candidates"][0]["content"]["parts"]
        image_parts = [part for part in response_parts if part.get("inlineData", False)]
        if len(image_parts) == 1:
            base64_image = image_parts[0]["inlineData"]["data"]
            with open(output_file, "wb") as f:
                f.write(base64.b64decode(base64_image))
            return f"Successfully generated image to {output_file}"
        raise Exception("Failed to generate image")

    data = body.get("data", [])
    if not data:
        raise Exception("Failed to generate image: missing data field")

    item = data[0]
    if item.get("b64_json"):
        with open(output_file, "wb") as f:
            f.write(base64.b64decode(item["b64_json"]))
        return f"Successfully generated image to {output_file}"

    if item.get("url"):
        image_response = requests.get(item["url"], timeout=timeout)
        image_response.raise_for_status()
        with open(output_file, "wb") as f:
            f.write(image_response.content)
        return f"Successfully downloaded generated image to {output_file}"

    raise Exception("Failed to generate image: neither b64_json nor url returned")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate images using Gemini API")
    parser.add_argument(
        "--prompt-file",
        required=True,
        help="Absolute path to JSON prompt file",
    )
    parser.add_argument(
        "--reference-images",
        nargs="*",
        default=[],
        help="Absolute paths to reference images (space-separated)",
    )
    parser.add_argument(
        "--output-file",
        required=True,
        help="Output path for generated image",
    )
    parser.add_argument(
        "--aspect-ratio",
        required=False,
        default="16:9",
        help="Aspect ratio of the generated image",
    )

    args = parser.parse_args()

    try:
        print(
            generate_image(
                args.prompt_file,
                args.reference_images,
                args.output_file,
                args.aspect_ratio,
            )
        )
    except Exception as e:
        print(f"Error while generating image: {e}")
