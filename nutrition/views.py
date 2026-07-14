from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import NutritionGoals, FoodItems, MealLogs
from .serializers import NutritionGoalsSerializer, FoodItemsSerializer, MealLogsSerializer
from authentication.serializers import calculate_and_save_nutrition_goals
import datetime

class NutritionCalculateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        required_fields = ['age', 'gender', 'height', 'weight', 'activity_level', 'fitness_goal']
        for field in required_fields:
            if field not in data:
                return Response({field: f'{field} is required.'}, status=status.HTTP_400_BAD_REQUEST)
                
        try:
            calculate_and_save_nutrition_goals(request.user, data)
            goals = NutritionGoals.objects.get(user=request.user)
            serializer = NutritionGoalsSerializer(goals)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MealLogViewSet(viewsets.ModelViewSet):
    serializer_class = MealLogsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = MealLogs.objects.filter(user=self.request.user)
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(date=date)
            except ValueError:
                pass
        else:
            queryset = queryset.filter(date=datetime.date.today())
        return queryset.order_by('id')

class FoodItemViewSet(viewsets.ModelViewSet):
    serializer_class = FoodItemsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = FoodItems.objects.all()
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
        return queryset.order_by('name')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
