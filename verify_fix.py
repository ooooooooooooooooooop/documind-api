
import requests
import os

def test_upload():
    url = "http://localhost:8000/upload"
    file_path = r"C:\Desktop\documind-api\temp_uploads/test_doc.txt"
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    print(f"Uploading {file_path}...")
    try:
        with open(file_path, "rb") as f:
            # 使用正确的文件上传格式：(filename, fileobj, content_type)
            # 使用原始文件名
            files = {"file": ("test_doc.txt", f, "text/plain")}
            response = requests.post(url, files=files)
            
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_upload()
