from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Progress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress_logs')
    date = models.DateField()
    weight = models.FloatField()  # in kg
    water_intake = models.FloatField(default=0.0)  # in Litres

    class Meta:
        db_table = 'Progress'
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.email} - Weight: {self.weight}kg, Water: {self.water_intake}L on {self.date}"

class Reports(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    date_generated = models.DateTimeField(auto_now_add=True)
    report_type = models.CharField(max_length=20)  # Daily, Weekly, Monthly
    start_date = models.DateField()
    end_date = models.DateField()
    pdf_file = models.FileField(upload_to='reports/', null=True, blank=True)

    class Meta:
        db_table = 'Reports'

    def __str__(self):
        return f"{self.user.email} - {self.report_type} Report ({self.start_date} to {self.end_date})"
