from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NutritionCalculateView, MealLogViewSet, FoodItemViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'meals', MealLogViewSet, basename='meals')
router.register(r'foods', FoodItemViewSet, basename='foods')

urlpatterns = [
    path('nutrition/calculate', NutritionCalculateView.as_view(), name='nutrition_calculate'),
    path('', include(router.urls)),
]
