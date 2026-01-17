import { CompanyCard } from './CompanyCard';
import { Loading } from '../common/Loading';

export function CompaniesGrid({ companies, isLoading, emptyMessage = 'Nenhuma empresa encontrada.' }) {
  if (isLoading) {
    return <Loading />;
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          linkTo={`/companies/${company.id}`}
        />
      ))}
    </div>
  );
}
