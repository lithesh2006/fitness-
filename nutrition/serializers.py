from rest_framework import serializers
from .models import NutritionGoals, FoodItems, MealLogs

class NutritionGoalsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionGoals
        fields = ['id', 'calories_goal', 'protein_goal', 'carbs_goal', 'fat_goal', 'fiber_goal', 'water_goal', 'updated_at']

class FoodItemsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItems
        fields = ['id', 'name', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'created_by']
        read_only_fields = ['created_by']

class MealLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealLogs
        fields = ['id', 'date', 'meal_type', 'food_name', 'quantity', 'calories', 'protein', 'carbohydrates', 'fat', 'fiber']
        
    def create(self, validated_data):
        # Automatically assign the logging user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)
