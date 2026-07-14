from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserProfile
from nutrition.models import NutritionGoals

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['age', 'gender', 'height', 'weight', 'activity_level', 'fitness_goal']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'profile']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    age = serializers.IntegerField(required=True)
    gender = serializers.ChoiceField(choices=UserProfile.GENDER_CHOICES, required=True)
    height = serializers.FloatField(required=True)
    weight = serializers.FloatField(required=True)
    activity_level = serializers.ChoiceField(choices=UserProfile.ACTIVITY_LEVEL_CHOICES, required=True)
    fitness_goal = serializers.ChoiceField(choices=UserProfile.FITNESS_GOAL_CHOICES, required=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'confirm_password', 'age', 'gender', 'height', 'weight', 'activity_level', 'fitness_goal']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields must match."})
        return attrs

    def create(self, validated_data):
        email = validated_data['email']
        full_name = validated_data['full_name']
        password = validated_data['password']
        
        user = User.objects.create_user(email=email, full_name=full_name, password=password)
        
        UserProfile.objects.create(
            user=user,
            age=validated_data['age'],
            gender=validated_data['gender'],
            height=validated_data['height'],
            weight=validated_data['weight'],
            activity_level=validated_data['activity_level'],
            fitness_goal=validated_data['fitness_goal']
        )
        
        # Calculate and save initial nutrition goals
        calculate_and_save_nutrition_goals(user, validated_data)
        
        return user

def calculate_and_save_nutrition_goals(user, data):
    age = data['age']
    gender = data['gender']
    height = data['height']
    weight = data['weight']
    activity = data['activity_level']
    goal = data['fitness_goal']
    
    # 1. BMR (Mifflin-St Jeor)
    if gender == 'Male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
    # 2. TDEE Multiplier
    activity_multipliers = {
        'Sedentary': 1.2,
        'Lightly Active': 1.375,
        'Moderately Active': 1.55,
        'Very Active': 1.725,
        'Athlete': 1.9,
    }
    tdee = bmr * activity_multipliers.get(activity, 1.2)
    
    # 3. Daily Calories Required based on fitness goal
    goal_adjustments = {
        'Weight Loss': -500,
        'Weight Maintenance': 0,
        'Weight Gain': 500,
        'Muscle Gain': 300,
    }
    calories_goal = int(tdee + goal_adjustments.get(goal, 0))
    
    # Ensure calories are not dangerously low
    if calories_goal < 1200:
        calories_goal = 1200
        
    # 4. Macronutrients Calculations
    # Protein: based on weight and goal
    if goal in ['Muscle Gain', 'Weight Gain']:
        protein_factor = 2.2
    elif goal == 'Weight Loss':
        protein_factor = 1.8
    else:
        protein_factor = 1.5
    protein_goal = round(weight * protein_factor, 1)
    
    # Fat: 25% of calories (1g fat = 9 kcal)
    fat_goal = round((calories_goal * 0.25) / 9, 1)
    
    # Carbs: remainder of calories (1g carb = 4 kcal)
    protein_calories = protein_goal * 4
    fat_calories = fat_goal * 9
    carbs_calories = max(0, calories_goal - (protein_calories + fat_calories))
    carbs_goal = round(carbs_calories / 4, 1)
    
    # Fiber: 14g per 1000 kcal
    fiber_goal = round(14 * (calories_goal / 1000), 1)
    
    # Water: weight-based + activity adjustments
    water_base = weight * 0.033
    activity_water_adj = 1.0 if activity in ['Very Active', 'Athlete'] else 0.5 if activity == 'Moderately Active' else 0.0
    water_goal = round(water_base + activity_water_adj, 1)
    
    NutritionGoals.objects.update_or_create(
        user=user,
        defaults={
            'calories_goal': calories_goal,
            'protein_goal': protein_goal,
            'carbs_goal': carbs_goal,
            'fat_goal': fat_goal,
            'fiber_goal': fiber_goal,
            'water_goal': water_goal,
        }
    )
