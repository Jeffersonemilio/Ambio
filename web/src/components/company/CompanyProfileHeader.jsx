import { Building2, CheckCircle, XCircle } from 'lucide-react';

function formatCnpj(cnpj) {
  if (!cnpj) return '-';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function CompanyProfileHeader({ company, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-36" />
          </div>
        </div>
      </div>
    );
  }

  const isActive = company?.isActive !== false;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {company?.name || 'Empresa'}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Ativo
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3" />
                  Inativo
                </>
              )}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            CNPJ: {formatCnpj(company?.cnpj)}
          </p>
        </div>
      </div>
    </div>
  );
}
