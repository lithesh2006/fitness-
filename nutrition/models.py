from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class NutritionGoals(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nutrition_goals')
    calories_goal = models.IntegerField()
    protein_goal = models.FloatField()
    carbs_goal = models.FloatField()
    fat_goal = models.FloatField()
    fiber_goal = models.FloatField()
    water_goal = models.FloatField()  # In Litres
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'NutritionGoals'

    def __str__(self):
        return f"{self.user.email}'s Nutrition Goals"

class FoodItems(models.Model):
    name = models.CharField(max_length=255)
    calories = models.IntegerField()
    protein = models.FloatField()
    carbohydrates = models.FloatField()
    fat = models.FloatField()
    fiber = models.FloatField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'FoodItems'

    def __str__(self):
        return self.name

class MealLogs(models.Model):
    MEAL_TYPES = (
        ('Breakfast', 'Breakfast'),
        ('Lunch', 'Lunch'),
        ('Dinner', 'Dinner'),
        ('Snacks', 'Snacks'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='meal_logs')
    date = models.DateField()
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES)
    food_name = models.CharField(max_length=255)
    quantity = models.FloatField()  # Quantity in grams or servings
    calories = models.IntegerField()
    protein = models.FloatField()
    carbohydrates = models.FloatField()
    fat = models.FloatField()
    fiber = models.FloatField()

    class Meta:
        db_table = 'MealLogs'

    def __str__(self):
        return f"{self.user.email} - {self.meal_type} - {self.food_name} on {self.date}"
