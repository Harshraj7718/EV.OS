import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Eye, FileText } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { HeroWatermark } from '@/components/shared/HeroWatermark';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DocumentItem {
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
}

const DOCUMENTS: DocumentItem[] = [
  {
    title: 'Company Brochure',
    description: 'An overview of the Booklynk EV platform, investment model, and fleet operations.',
    fileName: 'Booklynk_EV_brochure.pdf',
    fileUrl: '/documents/Booklynk_EV_brochure.pdf',
  },
  {
    title: 'Draft Investment Agreement',
    description: 'The standard investment and rental agreement terms shared with every investor.',
    fileName: 'draft_agreement_revised.pdf',
    fileUrl: '/documents/draft_agreement_revised.pdf',
  },
];

interface DocumentsSectionProps {
  showWatermark?: boolean;
}

export const DocumentsSection = ({ showWatermark = false }: DocumentsSectionProps) => {
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  return (
    <section id="documents" className="border-y border-border bg-muted/30 py-24 sm:py-32">
      <div className="container">
        <div className="relative min-h-[220px] overflow-hidden sm:min-h-[280px]">
          {showWatermark && <HeroWatermark text="Resources" />}
          <SectionHeading
            eyebrow="Resources"
            title="Brochure & Draft Agreement"
            description="Download our company brochure and review the draft investment agreement before you commit."
          />
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-5 sm:grid-cols-2">
          {DOCUMENTS.map((doc, index) => (
            <motion.div
              key={doc.fileName}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
              className="glass flex flex-col rounded-2xl p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold">{doc.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {doc.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => setPreviewDoc(doc)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Preview
                </Button>
                <Button asChild size="sm">
                  <a href={doc.fileUrl} download={doc.fileName}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </a>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="h-[75vh] w-full overflow-hidden rounded-lg border border-border">
              <iframe src={previewDoc.fileUrl} title={previewDoc.title} className="h-full w-full" />
            </div>
          )}
          {previewDoc && (
            <div className="flex justify-end">
              <Button asChild size="sm">
                <a href={previewDoc.fileUrl} download={previewDoc.fileName}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
