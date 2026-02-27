import sys
from PIL import Image

def resize_icon(input_path, output_dir):
    try:
        img = Image.open(input_path)
        img192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img192.save(f"{output_dir}/icon-192.png", format="PNG")
        
        img512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img512.save(f"{output_dir}/icon-512.png", format="PNG")
        
        print("Icons resized successfully.")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

if __name__ == "__main__":
    input_image = r"C:\Users\Admin\.gemini\antigravity\brain\6da8356c-024a-46b2-9a51-d99f470ca14d\kusti_app_icon_1772203278160.png"
    output_directory = r"C:\Users\Admin\.gemini\antigravity\scratch\kusti_mallavidya"
    resize_icon(input_image, output_directory)
