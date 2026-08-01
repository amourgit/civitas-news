export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateTitle(title: string): string | null {
  if (!title || title.trim().length < 5) {
    return 'Le titre doit comporter au moins 5 caractères.';
  }
  if (title.length > 150) {
    return 'Le titre ne peut pas dépasser 150 caractères.';
  }
  return null;
}

export function validateDescription(desc: string): string | null {
  if (!desc || desc.trim().length < 10) {
    return 'La description doit comporter au moins 10 caractères.';
  }
  return null;
}
