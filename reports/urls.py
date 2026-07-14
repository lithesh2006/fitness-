from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProgressViewSet, DailyReportView, WeeklyReportView,
    MonthlyReportView, PdfReportView
)

router = DefaultRouter(trailing_slash=False)
router.register(r'progress', ProgressViewSet, basename='progress')

urlpatterns = [
    path('', include(router.urls)),
    path('reports/daily', DailyReportView.as_view(), name='reports_daily'),
    path('reports/weekly', WeeklyReportView.as_view(), name='reports_weekly'),
    path('reports/monthly', MonthlyReportView.as_view(), name='reports_monthly'),
    path('reports/pdf', PdfReportView.as_view(), name='reports_pdf'),
]
