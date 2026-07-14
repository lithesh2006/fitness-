from rest_framework import serializers
from .models import Exercise, WorkoutPlans, WorkoutPlanExercise, WorkoutLogs

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'category']

class WorkoutPlanExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.ReadOnlyField(source='exercise.name')
    exercise_category = serializers.ReadOnlyField(source='exercise.category')

    class Meta:
        model = WorkoutPlanExercise
        fields = ['id', 'exercise', 'exercise_name', 'exercise_category', 'sets', 'reps', 'weight', 'duration', 'rest_time']

class WorkoutPlansSerializer(serializers.ModelSerializer):
    exercises = WorkoutPlanExerciseSerializer(many=True, required=False)

    class Meta:
        model = WorkoutPlans
        fields = ['id', 'name', 'created_at', 'exercises']

    def create(self, validated_data):
        request = self.context.get('request')
        exercises_data = request.data.get('exercises', [])
        
        plan = WorkoutPlans.objects.create(user=request.user, name=validated_data['name'])
        
        for exercise_data in exercises_data:
            exercise_id = exercise_data.get('exercise')
            if exercise_id:
                try:
                    exercise = Exercise.objects.get(id=exercise_id)
                    WorkoutPlanExercise.objects.create(
                        plan=plan,
                        exercise=exercise,
                        sets=exercise_data.get('sets', 3),
                        reps=exercise_data.get('reps', 10),
                        weight=exercise_data.get('weight', 0.0),
                        duration=exercise_data.get('duration', 0),
                        rest_time=exercise_data.get('rest_time', 60),
                    )
                except Exercise.DoesNotExist:
                    pass
        return plan

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        
        request = self.context.get('request')
        exercises_data = request.data.get('exercises', [])
        if exercises_data:
            instance.exercises.all().delete()
            for exercise_data in exercises_data:
                exercise_id = exercise_data.get('exercise')
                if exercise_id:
                    try:
                        exercise = Exercise.objects.get(id=exercise_id)
                        WorkoutPlanExercise.objects.create(
                            plan=instance,
                            exercise=exercise,
                            sets=exercise_data.get('sets', 3),
                            reps=exercise_data.get('reps', 10),
                            weight=exercise_data.get('weight', 0.0),
                            duration=exercise_data.get('duration', 0),
                            rest_time=exercise_data.get('rest_time', 60),
                        )
                    except Exercise.DoesNotExist:
                        pass
        return instance

class WorkoutLogsSerializer(serializers.ModelSerializer):
    exercise_name = serializers.ReadOnlyField(source='exercise.name')
    exercise_category = serializers.ReadOnlyField(source='exercise.category')

    class Meta:
        model = WorkoutLogs
        fields = ['id', 'date', 'exercise', 'exercise_name', 'exercise_category', 'sets', 'reps', 'weight', 'duration', 'rest_time']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        return super().create(validated_data)
