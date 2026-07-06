# Generated migration for FeeStructure versioning fields

from django.db import migrations, models
import django.conf


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0002_feelevy_levypayment'),
    ]

    operations = [
        migrations.AddField(
            model_name='feestructure',
            name='created_by',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=models.deletion.SET_NULL,
                related_name='created_fee_structures',
                to=django.conf.settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='feestructure',
            name='previous_version',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=models.deletion.SET_NULL,
                related_name='next_versions',
                to='fees.feestructure'
            ),
        ),
        migrations.AddField(
            model_name='feestructure',
            name='version',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
