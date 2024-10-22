"use client"

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface PDFProcessorProps {
  onUpload: (text: string) => void;
}

const PDFProcessor: React.FC<PDFProcessorProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const { toast } = useToast();
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfModule = await import('pdfjs-dist');
      setPdfjs(pdfModule);
      pdfModule.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfModule.version}/pdf.worker.min.js`;
    };
    loadPdfJs();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const extractText = async () => {
    if (!file || !pdfjs) {
      toast({
        title: "Error",
        description: "Please select a PDF file first or wait for PDF.js to load.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `Page ${i}: ${pageText}\n\n`;
      }

      setExtractedText(fullText);
      
      // Generate summary using AI
      await generateSummary(fullText);

      toast({
        title: "Success",
        description: "Text extracted and summarized successfully.",
      });
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to extract text or generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = async (text: string) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const prompt = `Please provide a concise summary of the following text. Ensure your response is properly formatted with paragraphs, correct grammar, and punctuation:\n\n${text}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setSummary(response.text());
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <Upload className="h-5 w-5" />
                </div>
                <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload PDF</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {file && (
          <Button onClick={extractText} disabled={!file || isLoading}>
            Summarize PDF
          </Button>
        )}
      </div>
      {isLoading ? (
        <Card className="mt-4">
          <CardContent className="flex items-center justify-center py-6">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            </div>
            <span className="ml-2">Summarizing...</span>
          </CardContent>
        </Card>
      ) : summary ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View Summary</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>PDF Summary</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{summary}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => {setSummary(''); setFile(null);}} variant="outline">
                Clear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
};

export default PDFProcessor;
