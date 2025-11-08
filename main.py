from fastapi import APIRouter, File, UploadFile, HTTPException, FastAPI
from fastapi.responses import JSONResponse, FileResponse
import os
import shutil
import tempfile
import time
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from services.etl_service import ETLPipeline
import json
from fastapi import Request
from fpdf import FPDF
import glob

PAGE_IMAGE_DIR = "out/converted_images"
PARSED_SECTIONS_DIR = "out/parsed_sections"
MODEL_PATH = "models/yolov12s-doclaynet.pt"

os.environ["GOOGLE_API_KEY"] = ""
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

app = FastAPI()
etl_pipeline = ETLPipeline(MODEL_PATH, PAGE_IMAGE_DIR, PARSED_SECTIONS_DIR)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Document Processing API"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    start = time.time()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name
    finally:
        file.file.close()
    initial_json_output = []
    try:
        image_paths = etl_pipeline.convert_document_to_images(temp_file_path, file.filename)
        for i, image_path in enumerate(image_paths):
            page_num = i + 1
            base_image_name = os.path.splitext(os.path.basename(image_path))[0]
            page_specific_output_dir = os.path.join(PARSED_SECTIONS_DIR, base_image_name)
            parsed_content = etl_pipeline.parse_image_layout(image_path, page_specific_output_dir)
            initial_json_output.append({
                "page no": page_num,
                "content": parsed_content
            })

        final_json_output = etl_pipeline.EvaluationAgent(initial_json_output)

        end = time.time()
        print(f"Total processing time: {end - start:.2f} seconds")
        return JSONResponse(content=final_json_output)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

