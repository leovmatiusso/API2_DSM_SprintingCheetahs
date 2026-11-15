import React, { useState, useRef, useEffect } from 'react';


export interface PdfReport {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  url: string;
}

const INITIAL_MOCK_PDFS: PdfReport[] = [
  {
    id: '1',
    name: 'relatorio_teste_carga_v1.pdf',
    size: '1.2 MB',
    uploadedAt: '12/11/2026 10:15',
    url: '#',
  },
  {
    id: '2',
    name: 'analise_termografia_motor_03.pdf',
    size: '3.4 MB',
    uploadedAt: '14/11/2026 16:45',
    url: '#',
  },
];

export const ServiceOrderPage: React.FC = () => {
  const [pdfs, setPdfs] = useState<PdfReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simula o carregamento inicial da API
  useEffect(() => {
    const timer = setTimeout(() => {
      setPdfs(INITIAL_MOCK_PDFS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Simulação de Upload com validação de tipo PDF
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showFeedback('error', 'Por favor, selecione um arquivo no formato PDF válido.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    // Simula delay de requisição assíncrona
    setTimeout(() => {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const newReport: PdfReport = {
        id: Date.now().toString(),
        name: file.name,
        size: `${fileSizeMB} MB`,
        uploadedAt: new Date().toLocaleString('pt-BR'),
        url: URL.createObjectURL(file), // URL temporária para visualização local
      };

      setPdfs((prev) => [newReport, ...prev]);
      setUploading(false);
      showFeedback('success', `Relatório "${file.name}" anexado com sucesso!`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1000);
  };

  // Simulação de Exclusão
  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o relatório "${name}"?`)) return;
    
    setPdfs((prev) => prev.filter((p) => p.id !== id));
    showFeedback('success', 'Relatório removido com sucesso.');
  };

  return (
    <div className="page p-6 sm:p-10">
      <div className="content space-y-6">
        
        {/* Cabeçalho da Ordem de Serviço */}
        <div className="card space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-text">Ordem de Serviço #OS-2026/048</h1>
            <span className="role-badge bg-primary/15 text-primary font-semibold">Em Testes</span>
          </div>
          <p className="text-sm text-muted">Módulo de monitoramento, laudos e histórico técnico.</p>
        </div>

        {/* Seção US27: Relatórios de Teste (PDF) */}
        <div className="card space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-text">Relatórios de Teste (PDF)</h3>
              <p className="text-sm text-muted mt-1">Histórico de laudos e resultados vinculados a esta Ordem de Serviço.</p>
            </div>

            {/* Input e Botão de Upload Customizado */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
                id="pdf-upload-input"
              />
              <label
                htmlFor="pdf-upload-input"
                className={`inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-text-inverted transition-all shadow-sm cursor-pointer ${
                  uploading 
                    ? 'bg-primary/50 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-hover active:scale-[0.98]'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-text-inverted" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Anexar Relatório PDF
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Alertas / Toasts (Sucesso ou Erro) */}
          {feedback && (
            <div className={feedback.type === 'success' ? 'success flex items-center justify-between' : 'error flex items-center justify-between'}>
              <span>{feedback.message}</span>
              <button onClick={() => setFeedback(null)} className="text-lg font-bold leading-none">&times;</button>
            </div>
          )}

          {/* Listagem ou Estado Vazio */}
          {loading ? (
            <div className="py-12 flex justify-center items-center text-muted">
              <svg className="animate-spin h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Carregando relatórios...
            </div>
          ) : pdfs.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 bg-bg-secondary">
              <div className="w-12 h-12 bg-bg-tertiary text-muted rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Nenhum relatório PDF anexado</p>
                <p className="text-xs text-muted mt-1">Envie o resultado dos testes para orientar as próximas equipes.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-bg">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="p-4 flex items-center justify-between hover:bg-bg-secondary transition-colors">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-danger-muted text-danger font-bold text-xs flex items-center justify-center shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate" title={pdf.name}>
                        {pdf.name}
                      </p>
                      <p className="text-xs text-muted">
                        Enviado em {pdf.uploadedAt} • <span className="font-medium text-text">{pdf.size}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-4">
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-semibold text-text bg-secondary hover:bg-secondary-hover border border-border rounded-md transition shadow-sm"
                    >
                      Visualizar
                    </a>
                    <button
                      onClick={() => handleDelete(pdf.id, pdf.name)}
                      className="p-1.5 text-muted hover:text-danger hover:bg-danger-muted rounded-md transition"
                      title="Excluir relatório"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};