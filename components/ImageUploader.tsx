import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ImageUploadProps } from '../types';

export const ImageUploader: React.FC<ImageUploadProps> = ({
  label,
  imageSrc,
  onUpload,
  onRemove,
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      
      {!imageSrc ? (
        <div 
          onClick={triggerUpload}
          className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors group"
        >
          <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" />
          <span className="text-xs text-slate-500 group-hover:text-blue-600 font-medium">اضغط لرفع الصورة</span>
        </div>
      ) : (
        <div className="relative border border-slate-200 rounded-lg overflow-hidden h-32 bg-slate-100 flex items-center justify-center">
          <img 
            src={imageSrc} 
            alt="Preview" 
            className="h-full w-full object-contain"
          />
          <button 
            onClick={onRemove}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
            title="حذف الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <input 
        type="file" 
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        id={id}
      />
    </div>
  );
};
