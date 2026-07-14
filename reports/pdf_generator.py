from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(user, report_type, start_date, end_date, data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    story = []
    styles = getSampleStyleSheet()
    
    # Custom colors and styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=15,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    # Add header info
    story.append(Paragraph(f"Nutrition & Fitness {report_type} Report", title_style))
    story.append(Paragraph(
        f"Generated for: {user.full_name} ({user.email})<br/>"
        f"Period: {start_date.strftime('%B %d, %Y')} to {end_date.strftime('%B %d, %Y')}", 
        subtitle_style
    ))
    story.append(Spacer(1, 10))
    
    # Section 1: Nutrition Overview Table
    story.append(Paragraph("Nutrition Overview", h2_style))
    
    if report_type == 'Daily':
        nutrition_data = [
            ['Metric', 'Target Goal', 'Consumed', 'Remaining'],
            ['Calories', f"{data['calories_goal']} kcal", f"{data['calories_consumed']} kcal", f"{data['calories_remaining']} kcal"],
            ['Protein', f"{data['protein_goal']} g", f"{data['protein_consumed']} g", f"{data['protein_remaining']} g"],
            ['Carbohydrates', f"{data['carbs_goal']} g", f"{data['carbs_consumed']} g", f"{data['carbs_remaining']} g"],
            ['Fat', f"{data['fat_goal']} g", f"{data['fat_consumed']} g", f"{data['fat_remaining']} g"],
            ['Fiber', f"{data['fiber_goal']} g", f"{data['fiber_consumed']} g", f"{data['fiber_remaining']} g"],
            ['Water', f"{data['water_goal']} L", f"{data['water_consumed']} L", f"{data['water_remaining']} L"],
        ]
    else: # Weekly or Monthly
        nutrition_data = [
            ['Metric', 'Total Consumed', 'Daily Average', 'Goal Target'],
            ['Calories', f"{data['total_calories']} kcal", f"{data['avg_calories']} kcal", f"{data['calories_goal']} kcal"],
            ['Protein', '-', f"{data['avg_protein']} g", f"{data['protein_goal']} g"],
            ['Carbohydrates', '-', f"{data['avg_carbs']} g", f"{data['carbs_goal']} g"],
            ['Fat', '-', f"{data['avg_fat']} g", f"{data['fat_goal']} g"],
            ['Fiber', '-', f"{data['avg_fiber']} g", f"{data['fiber_goal']} g"],
            ['Water', f"{data['total_water']} L", f"{data['avg_water']} L", f"{data['water_goal']} L"],
        ]
        
    t1 = Table(nutrition_data, colWidths=[150, 120, 120, 140])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('TOPPADDING', (0,1), (-1,-1), 6),
    ]))
    story.append(t1)
    story.append(Spacer(1, 20))
    
    # Section 2: Workout Summary Table
    story.append(Paragraph("Workout & Fitness Summary", h2_style))
    if report_type == 'Daily':
        workout_text = f"Total exercises completed today: {data['workout_completed']}<br/>"
        story.append(Paragraph(workout_text, body_style))
        story.append(Spacer(1, 10))
        
        if data['workouts_list']:
            workout_rows = [['Exercise', 'Sets', 'Reps', 'Weight', 'Duration', 'Rest Time']]
            for w in data['workouts_list']:
                workout_rows.append([
                    w['exercise_name'], 
                    str(w['sets']), 
                    str(w['reps']), 
                    f"{w['weight']} kg", 
                    f"{w['duration']} min", 
                    f"{w['rest_time']} s"
                ])
            t2 = Table(workout_rows, colWidths=[180, 50, 50, 70, 80, 80])
            t2.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0d9488')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,1), (-1,-1), 9),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t2)
    else:
        workout_text = (
            f"Total sessions completed: {data['total_workouts']} workouts.<br/>"
            f"Total active workout duration: {data['total_duration']} minutes.<br/>"
            f"Weight progress details: Starting weight was {data['start_weight']} kg, "
            f"ending at {data['end_weight']} kg (Average weight tracked: {data['avg_weight']} kg)."
        )
        story.append(Paragraph(workout_text, body_style))
        story.append(Spacer(1, 10))
        
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
