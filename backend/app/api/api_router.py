from fastapi import APIRouter
from app.api.endpoints import subjects, lecturers, semesters, registrations, curriculum, class_semester_subjects

api_router = APIRouter()
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(lecturers.router, prefix="/lecturers", tags=["lecturers"])
api_router.include_router(semesters.router, prefix="/semesters", tags=["semesters"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["registrations"])
api_router.include_router(curriculum.router, prefix="/curriculum", tags=["curriculum"])
api_router.include_router(class_semester_subjects.router, prefix="/class-semester-subjects", tags=["class-semester-subjects"])
