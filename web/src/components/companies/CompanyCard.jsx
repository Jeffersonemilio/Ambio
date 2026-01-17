import { Link } from 'react-router-dom';
import { Building2, Radio, Users, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { formatRelativeTime } from '../../utils/formatters';

export function CompanyCard({ company, linkTo }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 truncate">{company.name}</h3>
            {company.cnpj && (
              <p className="text-xs text-gray-500">{company.cnpj}</p>
            )}
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            company.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {company.is_active ? 'Ativa' : 'Inativa'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Radio className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600">Sensores:</span>
          <span className="font-medium">{company.sensor_count || 0}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Usuários:</span>
          <span className="font-medium">{company.user_count || 0}</span>
        </div>

        {company.last_reading_at && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
            <Clock className="w-3 h-3" />
            <span>Última leitura: {formatRelativeTime(company.last_reading_at)}</span>
          </div>
        )}
      </div>
    </Card>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
}
