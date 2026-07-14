from rest_framework import serializers
from .models import Progress, Reports

class ProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = ['id', 'date', 'weight', 'water_intake']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['user'] = request.user
        # Prevent creating duplicates for same user and date by using update_or_create
        user = request.user
        date = validated_data['date']
        instance, created = Progress.objects.update_or_create(
            user=user,
            date=date,
            defaults={
                'weight': validated_data.get('weight', 70.0),
                'water_intake': validated_data.get('water_intake', 0.0)
            }
        )
        return instance

class ReportsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reports
        fields = ['id', 'date_generated', 'report_type', 'start_date', 'end_date', 'pdf_file']
