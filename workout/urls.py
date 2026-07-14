from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExerciseViewSet, WorkoutPlanViewSet, WorkoutLogViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'workouts', WorkoutLogViewSet, basename='workouts')
router.register(r'workout-plans', WorkoutPlanViewSet, basename='workout-plans')
router.register(r'exercises', ExerciseViewSet, basename='exercises')

urlpatterns = [
    path('', include(router.urls)),
]
