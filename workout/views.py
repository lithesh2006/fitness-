from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Exercise, WorkoutPlans, WorkoutLogs
from .serializers import ExerciseSerializer, WorkoutPlansSerializer, WorkoutLogsSerializer
import datetime

class ExerciseViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Exercise.objects.all()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(name__icontains=search)
            
        return queryset.order_by('category', 'name')

class WorkoutPlanViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutPlansSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutPlans.objects.filter(user=self.request.user).order_by('-created_at')

class WorkoutLogViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutLogsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = WorkoutLogs.objects.filter(user=self.request.user)
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date=date)
            except ValueError:
                pass
        return queryset.order_by('id')

    @action(detail=False, methods=['get'], url_path='strength-history')
    def strength_history(self, request):
        exercise_id = request.query_params.get('exercise_id')
        if not exercise_id:
            return Response({'error': 'exercise_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        logs = WorkoutLogs.objects.filter(
            user=request.user,
            exercise_id=exercise_id
        ).order_by('date')
        
        history = []
        for log in logs:
            history.append({
                'date': log.date.strftime('%Y-%m-%d'),
                'weight': log.weight,
                'reps': log.reps,
                'sets': log.sets,
                'estimated_1rm': round(log.weight * (1 + log.reps / 30.0), 1)
            })
            
        return Response(history)
