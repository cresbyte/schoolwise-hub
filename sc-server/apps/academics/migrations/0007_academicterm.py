# Generated migration for AcademicTerm model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0006_termevent'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcademicTerm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField()),
                ('term_number', models.IntegerField()),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_current', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Academic Term',
                'verbose_name_plural': 'Academic Terms',
                'ordering': ['year', 'term_number'],
                'unique_together': {('year', 'term_number')},
            },
        ),
    ]
