from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from nutrition.models import NutritionGoals, MealLogs
from workout.models import WorkoutLogs
from reports.models import Progress
from django.db.models import Sum, Count
import datetime

class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        date_str = request.query_params.get('date')
        
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                date = datetime.date.today()
        else:
            date = datetime.date.today()
            
        # 1. Get User Nutrition Goals
        try:
            goals = NutritionGoals.objects.get(user=user)
            cal_goal = goals.calories_goal
            prot_goal = goals.protein_goal
            carbs_goal = goals.carbs_goal
            fat_goal = goals.fat_goal
            fiber_goal = goals.fiber_goal
            water_goal = goals.water_goal
        except NutritionGoals.DoesNotExist:
            cal_goal = 2000
            prot_goal = 140.0
            carbs_goal = 240.0
            fat_goal = 60.0
            fiber_goal = 25.0
            water_goal = 2.5

        # 2. Get consumed nutrition totals
        meals_today = MealLogs.objects.filter(user=user, date=date)
        consumed = meals_today.aggregate(
            cal=Sum('calories'),
            prot=Sum('protein'),
            carbs=Sum('carbohydrates'),
            fat=Sum('fat'),
            fib=Sum('fiber')
        )
        
        cal_consumed = consumed['cal'] or 0
        prot_consumed = round(consumed['prot'] or 0.0, 1)
        carbs_consumed = round(consumed['carbs'] or 0.0, 1)
        fat_consumed = round(consumed['fat'] or 0.0, 1)
        fiber_consumed = round(consumed['fib'] or 0.0, 1)

        # 3. Workouts completed
        workouts_today = WorkoutLogs.objects.filter(user=user, date=date)
        workout_completed = workouts_today.values('exercise').distinct().count()

        # 4. Progress (water & weight) for this date
        progress_today = Progress.objects.filter(user=user, date=date).first()
        water_consumed = progress_today.water_intake if progress_today else 0.0
        
        # Fetch latest logged weight up to this date
        latest_progress = Progress.objects.filter(user=user, date__lte=date).order_by('-date').first()
        current_weight = latest_progress.weight if latest_progress else (user.profile.weight if hasattr(user, 'profile') else 70.0)
        
        # BMI Calculation
        height_m = (user.profile.height / 100.0) if (hasattr(user, 'profile') and user.profile.height) else 1.7
        bmi = round(current_weight / (height_m ** 2), 1)

        # Cards compilation
        cards = {
            'calories_goal': cal_goal,
            'calories_consumed': cal_consumed,
            'calories_remaining': max(0, cal_goal - cal_consumed),
            'protein_goal': prot_goal,
            'protein_consumed': prot_consumed,
            'protein_remaining': max(0.0, round(prot_goal - prot_consumed, 1)),
            'carbs_goal': carbs_goal,
            'carbs_consumed': carbs_consumed,
            'carbs_remaining': max(0.0, round(carbs_goal - carbs_consumed, 1)),
            'fat_goal': fat_goal,
            'fat_consumed': fat_consumed,
            'fat_remaining': max(0.0, round(fat_goal - fat_consumed, 1)),
            'fiber_goal': fiber_goal,
            'fiber_consumed': fiber_consumed,
            'fiber_remaining': max(0.0, round(fiber_goal - fiber_consumed, 1)),
            'water_goal': water_goal,
            'water_consumed': water_consumed,
            'water_remaining': max(0.0, round(water_goal - water_consumed, 1)),
            'workout_completed': workout_completed,
            'current_weight': current_weight,
            'bmi': bmi
        }

        # 5. Charts Compilation (Last 7 Days up to requested date)
        chart_days = [date - datetime.timedelta(days=i) for i in range(6, -1, -1)]
        range_start = chart_days[0]
        range_end = chart_days[-1]
        
        meals_range = MealLogs.objects.filter(user=user, date__range=(range_start, range_end)) \
            .values('date').annotate(cal=Sum('calories'))
        meals_by_date = {m['date']: m['cal'] for m in meals_range}
        
        workouts_range = WorkoutLogs.objects.filter(user=user, date__range=(range_start, range_end)) \
            .values('date').annotate(count=Count('id'))
        workouts_by_date = {w['date']: w['count'] for w in workouts_range}
        
        progress_range = Progress.objects.filter(user=user, date__range=(range_start, range_end))
        progress_by_date = {p.date: p.weight for p in progress_range}

        weekly_calories = []
        workout_progress = []
        weight_progress = []
        
        for day in chart_days:
            day_str = day.strftime('%a')
            day_date_str = day.strftime('%Y-%m-%d')
            
            weekly_calories.append({
                'day': day_str,
                'date': day_date_str,
                'consumed': meals_by_date.get(day, 0)
            })
            
            workout_progress.append({
                'day': day_str,
                'date': day_date_str,
                'count': workouts_by_date.get(day, 0)
            })
            
            # Fallback to nearest prior weight log if not recorded on this specific day
            weight_val = progress_by_date.get(day)
            if not weight_val:
                prior_prog = Progress.objects.filter(user=user, date__lte=day).order_by('-date').first()
                weight_val = prior_prog.weight if prior_prog else (user.profile.weight if hasattr(user, 'profile') else 70.0)
            
            weight_progress.append({
                'day': day_str,
                'date': day_date_str,
                'weight': weight_val
            })

        charts = {
            'weekly_calories': weekly_calories,
            'nutrition_distribution': [
                {'name': 'Protein', 'value': prot_consumed},
                {'name': 'Carbohydrates', 'value': carbs_consumed},
                {'name': 'Fat', 'value': fat_consumed}
            ],
            'workout_progress': workout_progress,
            'weight_progress': weight_progress
        }

        # 6. Recent Activity compilation
        recent_meals = [{
            'id': meal.id,
            'meal_type': meal.meal_type,
            'food_name': meal.food_name,
            'calories': meal.calories,
            'protein': meal.protein,
            'carbohydrates': meal.carbohydrates,
            'fat': meal.fat,
            'fiber': meal.fiber,
            'quantity': meal.quantity
        } for meal in meals_today]
            
        recent_workouts = [{
            'id': wl.id,
            'exercise_id': wl.exercise.id,
            'exercise_name': wl.exercise.name,
            'category': wl.exercise.category,
            'sets': wl.sets,
            'reps': wl.reps,
            'weight': wl.weight,
            'duration': wl.duration,
            'rest_time': wl.rest_time
        } for wl in workouts_today]

        recent_activity = {
            'meals': recent_meals,
            'workouts': recent_workouts,
            'weight': current_weight,
            'water_intake': water_consumed
        }

        return Response({
            'date': date.strftime('%Y-%m-%d'),
            'cards': cards,
            'charts': charts,
            'recent_activity': recent_activity
        })
