import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Home, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface HostelStepProps {
  formData: {
    livesInHostel: boolean;
    messMenuFile: File | null;
  };
  updateFormData: (field: string, value: any) => void;
}

export default function HostelAccommodationStep({ formData, updateFormData }: HostelStepProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid file (JPG, PNG, or PDF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError('');
    updateFormData('messMenuFile', file);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2 dark:text-gray-100">Accommodation Details</h2>
        <p className="text-gray-600 dark:text-gray-400">Help us customize your meal plan perfectly</p>
      </div>

      {/* Hostel Toggle */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                <Home className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <Label htmlFor="hostel-toggle" className="text-lg font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                  I live in a hostel
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  We&apos;ll create meal plans based on your mess menu
                </p>
              </div>
            </div>
            <Switch
              id="hostel-toggle"
              checked={formData.livesInHostel}
              onCheckedChange={(checked) => updateFormData('livesInHostel', checked)}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mess Menu Upload - Only shown if living in hostel */}
      {formData.livesInHostel && (
        <Card className="border-2 border-purple-200 dark:border-purple-800 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="mb-4">
              <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Upload Your Mess Menu
              </Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Upload a photo or PDF of your hostel mess menu (weekly/monthly)
              </p>
            </div>

            {!formData.messMenuFile ? (
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-8 text-center hover:border-purple-400 dark:hover:border-purple-600 transition-colors bg-purple-50/50 dark:bg-purple-950/20">
                <div className="mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">Upload Mess Menu</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    JPG, PNG, or PDF (Max 5MB)
                  </p>
                </div>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  className="hidden"
                  id="mess-menu-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="mess-menu-upload">
                  <Button type="button" variant="outline" className="cursor-pointer dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-950/30" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                {uploadError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {uploadError}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {formData.messMenuFile.name}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {(formData.messMenuFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFormData('messMenuFile', null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Why upload your mess menu?</p>
                  <p>Our AI will analyze your mess schedule and create meal plans that perfectly align with what&apos;s served in your hostel, making it super easy to follow!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alternative for non-hostel residents */}
      {!formData.livesInHostel && (
        <Card className="border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 dark:text-gray-100">
                Living at Home or PG?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Perfect! We&apos;ll create flexible meal plans with locally available ingredients that you can easily prepare or buy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}