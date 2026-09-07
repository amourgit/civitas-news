import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from '../hooks/useToast';

export default function CreerSondagePage() {
  useParams<{ newsId?: string; sujetId?: string }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [choix1, setChoix1] = useState('');
  const [choix2, setChoix2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !choix1 || !choix2) {
      toast('warning', 'Champs requis', 'Veuillez remplir la question et au moins deux choix.');
      return;
    }
    toast('success', 'Sondage ajouté !');
    navigate('/news');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-16">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-3">
        <CheckSquare className="w-7 h-7 text-[#5B4DFF]" />
        Créer un Sondage Express
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1A1F4D] p-6 rounded-3xl border space-y-4">
        <Input
          label="Question du sondage *"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Êtes-vous satisfait du réseau WiFi ?"
        />
        <Input
          label="Choix 1 *"
          value={choix1}
          onChange={(e) => setChoix1(e.target.value)}
          placeholder="Ex: Satisfait"
        />
        <Input
          label="Choix 2 *"
          value={choix2}
          onChange={(e) => setChoix2(e.target.value)}
          placeholder="Ex: Insatisfait"
        />

        <Button type="submit" variant="primary" size="md" className="w-full">
          Publier le Sondage
        </Button>
      </form>
    </div>
  );
}
