from fastapi import APIRouter
from app.api.endpoints import subjects, lecturers, semesters, registrations, programs, timetables, classes

api_router = APIRouter()
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(lecturers.router, prefix="/lecturers", tags=["lecturers"])
api_router.include_router(semesters.router, prefix="/semesters", tags=["semesters"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["registrations"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(timetables.router, prefix="/timetables", tags=["timetables"])
