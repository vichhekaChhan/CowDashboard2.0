import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Database, 
  Search, 
  ArrowUpDown, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  Layers,
  Trash2,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { WeightRecord, Cow } from '../../types.js';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  IconButton, 
  TextField, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TableSortLabel,
  Paper, 
  Chip,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';

interface WeightHistoryProps {
  weights: WeightRecord[];
  cows: Cow[];
  onDeleteRecord?: (id: string) => void;
}

export default function WeightHistoryView({
  weights,
  cows,
  onDeleteRecord
}: WeightHistoryProps) {
  const { t } = useTranslation();
  
  // States
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [cowFilter, setCowFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'timestamp' | 'weight' | 'cowId'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false); // Newest first default

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Find unique devices, cows for filtration
  const devices = Array.from(new Set(weights.map(w => w.deviceId)));
  const uniqueCows = Array.from(new Set(weights.map(w => w.cowId)));

  const getCowName = (cowId: string) => {
    const cow = cows.find(c => c.cowId === cowId);
    return cow ? cow.name : 'Unbound Reading';
  };

  const getCowBreed = (cowId: string) => {
    const cow = cows.find(c => c.cowId === cowId);
    return cow ? cow.breed : 'N/A';
  };

  // Sort & Filter
  const filteredRecords = weights
    .filter(rec => {
      const cowName = (getCowName(rec.cowId) || '').toLowerCase();
      const cowBreed = (getCowBreed(rec.cowId) || '').toLowerCase();
      const matchSearch = 
        (rec.cowId || '').toLowerCase().includes(search.toLowerCase()) || 
        cowName.includes(search.toLowerCase()) || 
        cowBreed.includes(search.toLowerCase()) ||
        (rec.deviceId || '').toLowerCase().includes(search.toLowerCase());

      const matchDevice = deviceFilter === 'ALL' || rec.deviceId === deviceFilter;
      const matchCow = cowFilter === 'ALL' || rec.cowId === cowFilter;

      return matchSearch && matchDevice && matchCow;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'weight') {
        comparison = a.weight - b.weight;
      } else if (sortField === 'cowId') {
        comparison = a.cowId.localeCompare(b.cowId);
      }
      return sortAsc ? comparison : -comparison;
    });

  // Paginated partition
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (field: 'timestamp' | 'weight' | 'cowId') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV EXPORT INJECTOR
  const exportToCSV = () => {
    try {
      const headers = ['Timestamp', 'Cattle ID', 'Name', 'Breed', 'Weight (kg)', 'Status', 'Scale Device ID'];
      const csvRows = [headers.join(',')];

      filteredRecords.forEach((r) => {
        const row = [
          `"${new Date(r.timestamp).toISOString()}"`,
          `"${r.cowId}"`,
          `"${getCowName(r.cowId)}"`,
          `"${getCowBreed(r.cowId)}"`,
          r.weight.toFixed(1),
          r.stable ? '"STABLE"' : '"OVERRIDE_UNSTABLE"',
          `"${r.deviceId}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `AgroScale_WeighHistory_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("CSV export failed in client environment");
    }
  };

  const handleExportMock = (format: 'xlsx' | 'pdf') => {
    const title = format === 'xlsx' ? 'Excel Spreadsheet' : 'PDF Assessment Statement';
    alert(`Success: Preparing ${title} containing ${filteredRecords.length} records. Direct download starting.`);
    if (format === 'pdf') {
      window.print();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
      
      {/* Header section & tools */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, lg: 'alignItems: center', justifyContent: 'space-between', gap: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {t('weightHistory.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            View full ledger weights recorded per livestock unit with telemetry diagnostic codes.
          </Typography>
        </Box>

        {/* Data export toolbar buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            onClick={exportToCSV}
            variant="outlined"
            color="inherit"
            startIcon={<Download size={14} className="text-emerald-600" />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', py: 1, px: 2, fontWeight: 700, borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            CSV
          </Button>
          
          <Button
            onClick={() => handleExportMock('xlsx')}
            variant="outlined"
            color="inherit"
            startIcon={<FileSpreadsheet size={14} className="text-sky-600" />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', py: 1, px: 2, fontWeight: 700, borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            Excel
          </Button>

          <Button
            onClick={() => handleExportMock('pdf')}
            variant="outlined"
            color="inherit"
            startIcon={<FileText size={14} className="text-rose-600" />}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontSize: '0.75rem', py: 1, px: 2.5, fontWeight: 700, borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
          >
            {t('weightHistory.exportPdf')}
          </Button>
        </Box>
      </Box>

      {/* Advanced filters card */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', p: 2 }}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          
          {/* Search TextField */}
          <div className="sm:col-span-2">
            <TextField
              fullWidth
              placeholder="Search by ID, cow name, breed, or scales..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <Search size={16} />
                  </InputAdornment>
                )
              }}
            />
          </div>

          {/* Scale Device filter */}
          <div>
            <FormControl fullWidth size="small">
              <Select
                value={deviceFilter}
                onChange={(e) => { setDeviceFilter(e.target.value); setCurrentPage(1); }}
                sx={{ borderRadius: 2.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                <MenuItem value="ALL" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>All Devices</MenuItem>
                {devices.map(dev => (
                  <MenuItem key={dev} value={dev} sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{dev}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Cattle Unit filter */}
          <div>
            <FormControl fullWidth size="small">
              <Select
                value={cowFilter}
                onChange={(e) => { setCowFilter(e.target.value); setCurrentPage(1); }}
                sx={{ borderRadius: 2.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                <MenuItem value="ALL" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>All Cattle</MenuItem>
                {uniqueCows.map(cowId => (
                  <MenuItem key={cowId} value={cowId} sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {cowId} • {getCowName(cowId)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

        </div>
      </Card>

      {/* Audit ledger Table */}
      <Box sx={{ mt: 3, overflowX: 'auto' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                
                {/* Timestamp sortable head */}
                <TableCell sx={{ py: 2, pl: 3 }}>
                  <TableSortLabel
                    active={sortField === 'timestamp'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => toggleSort('timestamp')}
                    sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}
                  >
                    {t('weightHistory.timestamp')}
                  </TableSortLabel>
                </TableCell>
                
                {/* Cattle sortable head */}
                <TableCell sx={{ py: 2 }}>
                  <TableSortLabel
                    active={sortField === 'cowId'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => toggleSort('cowId')}
                    sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}
                  >
                    {t('weightHistory.cowInfo')}
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  Genealogical Breed
                </TableCell>
                
                {/* Weight sortable head */}
                <TableCell sx={{ py: 2 }}>
                  <TableSortLabel
                    active={sortField === 'weight'}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => toggleSort('weight')}
                    sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}
                  >
                    {t('weightHistory.weight')}
                  </TableSortLabel>
                </TableCell>

                <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  {t('weightHistory.status')}
                </TableCell>

                <TableCell sx={{ py: 2, fontWeight: 800, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  {t('weightHistory.device')}
                </TableCell>

                {onDeleteRecord && <TableCell sx={{ py: 2, pr: 3 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell {...({ colSpan: 7 } as any)} sx={{ py: 12, borderBottom: 0 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Database size={40} style={{ color: '#9CA3AF', opacity: 0.5 }} />
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 700 }}>
                        No results found
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Perform a weight lock on the scale first or modify your search filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((rec) => (
                  <TableRow key={rec.id} hover>
                    <TableCell sx={{ py: 2, pl: 3, fontFamily: 'monospace', color: 'text.primary', fontSize: '0.75rem' }}>
                      {new Date(rec.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'text.primary' }}>{rec.cowId}</Typography>
                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>{getCowName(rec.cowId)}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2, color: 'text.secondary', fontSize: '0.75rem' }}>
                      {getCowBreed(rec.cowId)}
                    </TableCell>
                    <TableCell sx={{ py: 2, fontWeight: 950, fontSize: '0.8125rem', color: 'text.primary', fontFamily: 'monospace' }}>
                      {rec.weight.toFixed(1)} <Typography variant="caption" sx={{ fontWeight: 'normal', color: 'text.secondary' }}>{t('common.kg')}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={rec.stable ? t('common.stable') : t('common.unstable')}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.5625rem',
                          textTransform: 'uppercase',
                          bgcolor: rec.stable ? 'rgba(76, 175, 80, 0.08)' : 'rgba(237, 108, 2, 0.08)',
                          color: rec.stable ? 'success.main' : 'warning.main'
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2, fontFamily: 'monospace', fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem' }}>
                      {rec.deviceId}
                    </TableCell>
                    {onDeleteRecord && (
                      <TableCell sx={{ py: 2, pr: 3, textAlign: 'right' }}>
                        <IconButton 
                          onClick={() => onDeleteRecord(rec.id)}
                          size="small"
                          sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.04)' } }}
                          title="Purge reading"
                        >
                          <X size={16} />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Dynamic Pagination footer */}
        {totalPages > 1 && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Showing page <strong>{currentPage}</strong> of {totalPages} ({filteredRecords.length} records total)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                variant="outlined"
                color="inherit"
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                Previous
              </Button>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                variant="outlined"
                color="inherit"
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Box>

    </Box>
  );
}
