export interface ObserverData {
  // Candidate Info (Party 1)
  candidateName: string;
  candidateDistrict: string;

  // Observer Info (Party 2)
  observerName: string;
  nationalId: string;
  phone: string;
  voterCardNumber: string;
  address: string; // Neighborhood/Housing
  schoolName: string;

  // Images (Base64 strings)
  nationalCardFront: string | null;
  nationalCardBack: string | null;
  voterCardFront: string | null;
  voterCardBack: string | null;
}

export interface ImageUploadProps {
  label: string;
  imageSrc: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  id: string;
}
