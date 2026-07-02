from django.db import models

class NewsEvent(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    content = models.TextField()
    image = models.ImageField(upload_to="website/news/", null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Testimonial(models.Model):
    author = models.CharField(max_length=100)
    role = models.CharField(max_length=100) # e.g. Parent, Alumni
    content = models.TextField()
    photo = models.ImageField(upload_to="website/testimonials/", null=True, blank=True)
    
    def __str__(self):
        return self.author

class GalleryItem(models.Model):
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to="website/gallery/")
    category = models.CharField(max_length=50, blank=True)
    
    def __str__(self):
        return self.title
