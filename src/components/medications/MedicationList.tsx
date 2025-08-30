import React from 'react';
import { MedicationCard } from './MedicationCard';
import { Pill } from 'lucide-react';

interface MedicationListProps {
  medications: any[];
  onMedicationUpdate: () => void;
}

export function MedicationList({ medications, onMedicationUpdate }: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div className="text-center py-12">
        <Pill className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Medications Added</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start by adding your first medication to get personalized reminders
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Medications</h2>
        <span className="text-lg text-gray-600 dark:text-gray-400">{medications.length} medication{medications.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onUpdate={onMedicationUpdate}
          />
        ))}
      </div>
    </div>
  );
}