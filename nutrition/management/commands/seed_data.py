from django.core.management.base import BaseCommand
from nutrition.models import FoodItems
from workout.models import Exercise

class Command(BaseCommand):
    help = 'Seeds initial foods and exercises into the database'

    def handle(self, *args, **options):
        # 1. Seed Food Items
        foods = [
            {'name': 'Apple', 'calories': 95, 'protein': 0.5, 'carbohydrates': 25.0, 'fat': 0.3, 'fiber': 4.4},
            {'name': 'Banana', 'calories': 105, 'protein': 1.3, 'carbohydrates': 27.0, 'fat': 0.4, 'fiber': 3.1},
            {'name': 'Chicken Breast (Cooked, 100g)', 'calories': 165, 'protein': 31.0, 'carbohydrates': 0.0, 'fat': 3.6, 'fiber': 0.0},
            {'name': 'Whole Egg (Boiled, 1 large)', 'calories': 78, 'protein': 6.3, 'carbohydrates': 0.6, 'fat': 5.3, 'fiber': 0.0},
            {'name': 'Oatmeal (100g cooked)', 'calories': 68, 'protein': 2.4, 'carbohydrates': 12.0, 'fat': 1.4, 'fiber': 1.7},
            {'name': 'White Rice (Cooked, 100g)', 'calories': 130, 'protein': 2.7, 'carbohydrates': 28.0, 'fat': 0.3, 'fiber': 0.4},
            {'name': 'Almonds (30g)', 'calories': 173, 'protein': 6.0, 'carbohydrates': 6.0, 'fat': 15.0, 'fiber': 3.5},
            {'name': 'Salmon (Cooked, 100g)', 'calories': 206, 'protein': 22.0, 'carbohydrates': 0.0, 'fat': 12.0, 'fiber': 0.0},
            {'name': 'Whole Milk (250ml)', 'calories': 150, 'protein': 8.0, 'carbohydrates': 12.0, 'fat': 8.0, 'fiber': 0.0},
            {'name': 'Sweet Potato (Baked, 100g)', 'calories': 86, 'protein': 1.6, 'carbohydrates': 20.0, 'fat': 0.1, 'fiber': 3.0},
        ]

        for food in foods:
            FoodItems.objects.get_or_create(name=food['name'], defaults=food)
        self.stdout.write(self.style.SUCCESS('Successfully seeded foods.'))

        # 2. Seed Exercises
        exercises = [
            {'name': 'Bench Press', 'category': 'Chest'},
            {'name': 'Incline Dumbbell Press', 'category': 'Chest'},
            {'name': 'Pull-up', 'category': 'Back'},
            {'name': 'Barbell Row', 'category': 'Back'},
            {'name': 'Overhead Press', 'category': 'Shoulders'},
            {'name': 'Lateral Raise', 'category': 'Shoulders'},
            {'name': 'Bicep Curl', 'category': 'Arms'},
            {'name': 'Tricep Pushdown', 'category': 'Arms'},
            {'name': 'Squat', 'category': 'Legs'},
            {'name': 'Leg Press', 'category': 'Legs'},
            {'name': 'Plank', 'category': 'Core'},
            {'name': 'Crunch', 'category': 'Core'},
            {'name': 'Treadmill Run', 'category': 'Cardio'},
            {'name': 'Cycling', 'category': 'Cardio'},
        ]

        for ex in exercises:
            Exercise.objects.get_or_create(name=ex['name'], defaults=ex)
        self.stdout.write(self.style.SUCCESS('Successfully seeded exercises.'))
