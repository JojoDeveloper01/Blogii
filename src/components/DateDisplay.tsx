import { component$ } from '@builder.io/qwik';

interface DateDisplayProps {
  date: string | Date;
  className?: string;
}

export const DateDisplay = component$<DateDisplayProps>(({ date, className = '' }) => {
  const dateObj = new Date(date);
  const now = new Date();
  const isCurrentYear = dateObj.getFullYear() === now.getFullYear();

  // Formatar como dd/mm ou dd/mm/yyyy dependendo do ano
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: isCurrentYear ? undefined : 'numeric'
  }).format(dateObj);

  return (
    <time 
      dateTime={dateObj.toISOString()} 
      class={`text-sm ${className}`}
    >
      {formattedDate}
    </time>
  );
});
