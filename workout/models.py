from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Exercise(models.Model):
    CATEGORIES = (
        ('Chest', 'Chest'),
        ('Back', 'Back'),
        ('Shoulders', 'Shoulders'),
        ('Arms', 'Arms'),
        ('Legs', 'Legs'),
        ('Core', 'Core'),
        ('Cardio', 'Cardio'),
    )
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORIES)

    class Meta:
        db_table = 'Exercise'

    def __str__(self):
        return f"{self.name} ({self.category})"

class WorkoutPlans(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_plans')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'WorkoutPlans'

    def __str__(self):
        return f"{self.user.email} - {self.name}"

class WorkoutPlanExercise(models.Model):
    plan = models.ForeignKey(WorkoutPlans, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    sets = models.IntegerField(default=3)
    reps = models.IntegerField(default=10)
    weight = models.FloatField(default=0)  # in kg
    duration = models.IntegerField(default=0)  # in minutes
    rest_time = models.IntegerField(default=60)  # in seconds

    class Meta:
        db_table = 'WorkoutPlanExercise'

class WorkoutLogs(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_logs')
    date = models.DateField()
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    sets = models.IntegerField()
    reps = models.IntegerField()
    weight = models.FloatField()  # in kg
    duration = models.IntegerField()  # in minutes
    rest_time = models.IntegerField()  # in seconds

    class Meta:
        db_table = 'WorkoutLogs'

    def __str__(self):
        return f"{self.user.email} - {self.exercise.name} on {self.date}"
