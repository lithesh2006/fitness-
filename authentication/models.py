from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        # Use email as the username
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'Users'

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    )
    
    ACTIVITY_LEVEL_CHOICES = (
        ('Sedentary', 'Sedentary'),
        ('Lightly Active', 'Lightly Active'),
        ('Moderately Active', 'Moderately Active'),
        ('Very Active', 'Very Active'),
        ('Athlete', 'Athlete'),
    )
    
    FITNESS_GOAL_CHOICES = (
        ('Weight Loss', 'Weight Loss'),
        ('Weight Maintenance', 'Weight Maintenance'),
        ('Weight Gain', 'Weight Gain'),
        ('Muscle Gain', 'Muscle Gain'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    age = models.IntegerField()
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES)
    height = models.FloatField()  # in cm
    weight = models.FloatField()  # in kg
    activity_level = models.CharField(max_length=50, choices=ACTIVITY_LEVEL_CHOICES)
    fitness_goal = models.CharField(max_length=50, choices=FITNESS_GOAL_CHOICES)
    
    class Meta:
        db_table = 'UserProfile'

    def __str__(self):
        return f"{self.user.email}'s Profile"
