import { useState } from 'react';
import GradientButton from './GradientButton';

interface FilterPanelProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  searchTerm: string;
  fileFormat: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    fileFormat: 'all',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const handleChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      searchTerm: '',
      fileFormat: 'all',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Search
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search images..."
              value={filters.searchTerm}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  onFilterChange(filters);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <GradientButton
              onClick={() => onFilterChange(filters)}
              variant="primary"
              size="md"
            >
              🔍
            </GradientButton>
          </div>
        </div>

        {/* File Format */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Format
          </label>
          <select
            value={filters.fileFormat}
            onChange={(e) => handleChange('fileFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="all">All Formats</option>
            <option value="dicom">DICOM</option>
            <option value="aan">AAN</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="tiff">TIFF</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="date">Upload Date</option>
            <option value="name">File Name</option>
            <option value="size">File Size</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <GradientButton
            onClick={handleReset}
            variant="secondary"
            size="md"
            fullWidth
          >
            Reset Filters
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
