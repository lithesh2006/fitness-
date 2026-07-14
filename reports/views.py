from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from nutrition.models import NutritionGoals, MealLogs
from workout.models import WorkoutLogs
from .models import Progress, Reports
from .serializers import ProgressSerializer
from .pdf_generator import generate_pdf_report
from django.db.models import Sum, Avg, Count
import datetime

class ProgressViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Progress.objects.filter(user=self.request.user).order_by('-date')

def get_daily_data(user, date):
    try:
        goals = NutritionGoals.objects.get(user=user)
        cal_goal = goals.calories_goal
        prot_goal = goals.protein_goal
        carbs_goal = goals.carbs_goal
        fat_goal = goals.fat_goal
        fiber_goal = goals.fiber_goal
        water_goal = goals.water_goal
    except NutritionGoals.DoesNotExist:
        cal_goal, prot_goal, carbs_goal, fat_goal, fiber_goal, water_goal = 2000, 140.0, 240.0, 60.0, 25.0, 2.5

    meals = MealLogs.objects.filter(user=user, date=date)
    consumed = meals.aggregate(
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

    workouts = WorkoutLogs.objects.filter(user=user, date=date)
    workout_completed = workouts.values('exercise').distinct().count()
    workouts_list = [{
        'exercise_name': w.exercise.name,
        'sets': w.sets,
        'reps': w.reps,
        'weight': w.weight,
        'duration': w.duration,
        'rest_time': w.rest_time
    } for w in workouts]

    progress = Progress.objects.filter(user=user, date=date).first()
    water_consumed = progress.water_intake if progress else 0.0

    return {
        'date': date.strftime('%Y-%m-%d'),
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
        'workouts_list': workouts_list
    }

def get_range_data(user, start_date, end_date):
    try:
        goals = NutritionGoals.objects.get(user=user)
        cal_goal = goals.calories_goal
        prot_goal = goals.protein_goal
        carbs_goal = goals.carbs_goal
        fat_goal = goals.fat_goal
        fiber_goal = goals.fiber_goal
        water_goal = goals.water_goal
    except NutritionGoals.DoesNotExist:
        cal_goal, prot_goal, carbs_goal, fat_goal, fiber_goal, water_goal = 2000, 140.0, 240.0, 60.0, 25.0, 2.5

    days_diff = (end_date - start_date).days + 1
    if days_diff <= 0:
        days_diff = 1

    meals = MealLogs.objects.filter(user=user, date__range=(start_date, end_date))
    totals = meals.aggregate(
        total_cal=Sum('calories'),
        total_prot=Sum('protein'),
        total_carbs=Sum('carbohydrates'),
        total_fat=Sum('fat'),
        total_fib=Sum('fiber')
    )
    
    total_cal = totals['total_cal'] or 0
    avg_cal = round(total_cal / days_diff, 1)
    avg_prot = round((totals['total_prot'] or 0.0) / days_diff, 1)
    avg_carbs = round((totals['total_carbs'] or 0.0) / days_diff, 1)
    avg_fat = round((totals['total_fat'] or 0.0) / days_diff, 1)
    avg_fiber = round((totals['total_fib'] or 0.0) / days_diff, 1)

    workouts = WorkoutLogs.objects.filter(user=user, date__range=(start_date, end_date))
    total_workouts = workouts.values('date', 'exercise').distinct().count()
    total_duration = workouts.aggregate(duration=Sum('duration'))['duration'] or 0

    progress_logs = Progress.objects.filter(user=user, date__range=(start_date, end_date))
    total_water = progress_logs.aggregate(water=Sum('water_intake'))['water'] or 0.0
    avg_water = round(total_water / days_diff, 1)

    weight_logs = progress_logs.exclude(weight=None).order_by('date')
    weights = [log.weight for log in weight_logs]
    
    if weights:
        start_weight = weights[0]
        end_weight = weights[-1]
        avg_weight = round(sum(weights) / len(weights), 1)
        min_weight = min(weights)
        max_weight = max(weights)
    else:
        profile_weight = user.profile.weight if hasattr(user, 'profile') else 70.0
        start_weight = end_weight = avg_weight = min_weight = max_weight = profile_weight

    return {
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'calories_goal': cal_goal,
        'protein_goal': prot_goal,
        'carbs_goal': carbs_goal,
        'fat_goal': fat_goal,
        'fiber_goal': fiber_goal,
        'water_goal': water_goal,
        'total_calories': total_cal,
        'avg_calories': avg_cal,
        'avg_protein': avg_prot,
        'avg_carbs': avg_carbs,
        'avg_fat': avg_fat,
        'avg_fiber': avg_fiber,
        'total_water': total_water,
        'avg_water': avg_water,
        'total_workouts': total_workouts,
        'total_duration': total_duration,
        'start_weight': start_weight,
        'end_weight': end_weight,
        'avg_weight': avg_weight,
        'min_weight': min_weight,
        'max_weight': max_weight,
        'weight_progress_history': [{'date': log.date.strftime('%Y-%m-%d'), 'weight': log.weight} for log in weight_logs]
    }

class DailyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                date = datetime.date.today()
        else:
            date = datetime.date.today()

        data = get_daily_data(request.user, date)
        return Response(data)

class WeeklyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                end_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                end_date = datetime.date.today()
        else:
            end_date = datetime.date.today()

        start_date = end_date - datetime.timedelta(days=6)
        data = get_range_data(request.user, start_date, end_date)
        return Response(data)

class MonthlyReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        if date_str:
            try:
                end_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                end_date = datetime.date.today()
        else:
            end_date = datetime.date.today()

        start_date = end_date - datetime.timedelta(days=29)
        data = get_range_data(request.user, start_date, end_date)
        return Response(data)

class PdfReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'Daily')
        date_str = request.query_params.get('date')
        
        if date_str:
            try:
                end_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                end_date = datetime.date.today()
        else:
            end_date = datetime.date.today()

        if report_type == 'Daily':
            start_date = end_date
            data = get_daily_data(request.user, end_date)
        elif report_type == 'Weekly':
            start_date = end_date - datetime.timedelta(days=6)
            data = get_range_data(request.user, start_date, end_date)
        else: # Monthly
            start_date = end_date - datetime.timedelta(days=29)
            data = get_range_data(request.user, start_date, end_date)

        try:
            pdf_bytes = generate_pdf_report(request.user, report_type, start_date, end_date, data)
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{report_type.lower()}_report_{end_date.strftime("%Y%m%d")}.pdf"'
            
            # Log the generated report metadata in database
            Reports.objects.create(
                user=request.user,
                report_type=report_type,
                start_date=start_date,
                end_date=end_date
            )
            
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
