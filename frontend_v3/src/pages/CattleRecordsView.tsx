import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  AlertCircle, 
  ArrowUpDown,
  Filter,
  UserPlus,
  MoreVertical,
  Calendar,
  ChevronRight,
  Activity,
  Users
} from 'lucide-react';
import { Cow, WeightRecord } from '../types';
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
  Paper, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  InputAdornment,
  Avatar
} from '@mui/material';

interface CattleRecordsProps {
  cows: Cow[];
  weights: WeightRecord[];
  onAddCow: (cow: Omit<Cow, 'id' | 'createdAt'>) => Promise<boolean>;
  onEditCow: (id: string, cowData: Partial<Cow>) => Promise<boolean>;
  onDeleteCow: (id: string) => Promise<boolean>;
  onSelectCow: (id: string) => void;
}

export default function CattleRecordsView({
  cows,
  weights,
  onAddCow,
  onEditCow,
  onDeleteCow,
  onSelectCow
}: CattleRecordsProps) {
  const { t } = useTranslation();
  
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [breedFilter, setBreedFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'cowId' | 'name' | 'birthDate'>('cowId');
  const [sortAsc, setSortAsc] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);

  const [formCowId, setFormCowId] = useState('');
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState('Brahman');
  const [formGender, setFormGender] = useState<'Female' | 'Male'>('Female');
  const [formBirthDate, setFormBirthDate] = useState('2024-01-01');
  const [formImage, setFormImage] = useState('');
  const [formError, setFormError] = useState('');

  const breeds = Array.from(new Set(cows.map(c => c.breed)));

  const getLatestWeighInfo = (cowLabel: string) => {
    const cowWeights = weights.filter(w => w.cowId === cowLabel);
    if (cowWeights.length === 0) return { weight: '—', date: 'No records' };
    const sorted = [...cowWeights].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      weight: `${sorted[0].weight.toFixed(1)} kg`,
      date: new Date(sorted[0].timestamp).toLocaleDateString()
    };
  };

  const handleOpenAddModal = () => {
    setEditingCow(null);
    setFormCowId(`COW-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormBreed('Brahman');
    setFormGender('Female');
    setFormBirthDate('2024-01-01');
    setFormImage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cowId: formCowId,
      name: formName,
      breed: formBreed,
      gender: formGender,
      birthDate: formBirthDate,
      image: formImage || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=500'
    };
    const success = editingCow ? await onEditCow(editingCow.cowId, payload) : await onAddCow(payload);
    if (success) setIsModalOpen(false);
  };

  const processedCows = cows
    .filter(cow => {
      const matchSearch = cow.cowId.toLowerCase().includes(search.toLowerCase()) || cow.name.toLowerCase().includes(search.toLowerCase());
      const matchGender = genderFilter === 'ALL' || cow.gender.toUpperCase() === genderFilter;
      const matchBreed = breedFilter === 'ALL' || cow.breed === breedFilter;
      return matchSearch && matchGender && matchBreed;
    });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, pb: 4 }}>
      {/* Registry Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, md: 'alignItems: center', justifyContent: 'space-between', gap: 3 }}>
        <Box>
           <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}>
             Cattle Registry
           </Typography>
           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ h: 6, w: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Database & Registry
              </Typography>
           </Box>
        </Box>
        
        <Button 
          onClick={handleOpenAddModal}
          variant="contained"
          color="primary"
          startIcon={<UserPlus size={18} />}
          sx={{ 
            borderRadius: 8, 
            py: 1.75, 
            px: 4, 
            fontSize: '0.75rem', 
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)'
          }}
        >
          Register New Cattle
        </Button>
      </Box>

      {/* Filter and Search Bar Card */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', p: 1.5 }}>
         <Grid container spacing={2} alignItems="center">
           {/* Search field */}
           <Grid item xs={12} lg={6}>
             <TextField
               fullWidth
               placeholder="Search by ID or Name..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               size="small"
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                     <Search size={20} />
                   </InputAdornment>
                 ),
                 sx: { borderRadius: 3, bgcolor: 'action.hover', border: 0, '& fieldset': { border: 0 } }
               }}
             />
           </Grid>
           
           {/* Breed Filter select */}
           <Grid item xs={12} sm={6} lg={3}>
             <FormControl fullWidth size="small">
               <Select
                 value={breedFilter}
                 onChange={(e) => setBreedFilter(e.target.value)}
                 sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                 startAdornment={<Filter size={14} style={{ marginRight: 8, color: '#9e9e9e' }} />}
               >
                 <MenuItem value="ALL" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>All Breeds</MenuItem>
                 {breeds.map(b => (
                   <MenuItem key={b} value={b} sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{b}</MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>

           {/* Gender Filter select */}
           <Grid item xs={12} sm={6} lg={3}>
             <FormControl fullWidth size="small">
               <Select
                 value={genderFilter}
                 onChange={(e) => setGenderFilter(e.target.value)}
                 sx={{ borderRadius: 3, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                 startAdornment={<Users size={14} style={{ marginRight: 8, color: '#9e9e9e' }} />}
               >
                 <MenuItem value="ALL" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>All Genders</MenuItem>
                 <MenuItem value="FEMALE" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Females</MenuItem>
                 <MenuItem value="MALE" sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Males</MenuItem>
               </Select>
             </FormControl>
           </Grid>
         </Grid>
      </Card>

      {/* Registry Table List Card */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'text.secondary', py: 2.5, pl: 4 }}>Cattle Data</TableCell>
                <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'text.secondary', py: 2.5 }}>Classification</TableCell>
                <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'text.secondary', py: 2.5 }}>Latest Weigh</TableCell>
                <TableCell sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.625rem', letterSpacing: '0.1em', color: 'text.secondary', py: 2.5 }}>Health Status</TableCell>
                <TableCell sx={{ py: 2.5, pr: 4 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processedCows.map((cow) => {
                const weighInfo = getLatestWeighInfo(cow.cowId);
                return (
                  <TableRow 
                    key={cow.cowId} 
                    hover
                    sx={{ 
                      '&:last-child td': { border: 0 },
                      '&:hover .action-buttons': { opacity: 1, transform: 'translateX(0)' }
                    }}
                  >
                    {/* Cattle Bio info */}
                    <TableCell sx={{ py: 2.5, pl: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                         <Avatar 
                           src={cow.image || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=50'} 
                           alt={cow.name} 
                           variant="rounded"
                           sx={{ width: 56, height: 56, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}
                         />
                         <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                              {cow.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                               <Chip 
                                 label={cow.cowId} 
                                 size="small" 
                                 sx={{ 
                                   fontSize: '0.5625rem', 
                                   fontWeight: 900, 
                                   bgcolor: 'rgba(46, 125, 50, 0.08)', 
                                   color: 'primary.main',
                                   borderRadius: 1.5
                                 }} 
                               />
                               <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                 <Calendar size={10} /> Born {new Date(cow.birthDate).getFullYear()}
                               </Typography>
                            </Box>
                         </Box>
                      </Box>
                    </TableCell>

                    {/* Classification details */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                         <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                           {cow.breed}
                         </Typography>
                         <Chip 
                           label={cow.gender === 'Female' ? 'Parent Female' : 'Male Breeder'}
                           size="small"
                           sx={{
                             width: 'fit-content',
                             fontWeight: 900,
                             fontSize: '0.5625rem',
                             textTransform: 'uppercase',
                             bgcolor: cow.gender === 'Female' ? 'rgba(244, 143, 177, 0.15)' : 'rgba(144, 202, 249, 0.15)',
                             color: cow.gender === 'Female' ? 'error.main' : 'info.main'
                           }}
                         />
                      </Box>
                    </TableCell>

                    {/* Weight logs */}
                    <TableCell sx={{ py: 2.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                         <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontFamily: 'monospace' }}>
                           {weighInfo.weight}
                         </Typography>
                         <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                           {weighInfo.date}
                         </Typography>
                      </Box>
                    </TableCell>

                    {/* Status badge */}
                    <TableCell sx={{ py: 2.5 }}>
                       <Box sx={{ 
                         px: 1.75, 
                         py: 0.75, 
                         bgcolor: 'rgba(76, 175, 80, 0.06)', 
                         color: 'success.main', 
                         borderRadius: 4, 
                         display: 'flex', 
                         alignItems: 'center', 
                         gap: 1,
                         width: 'fit-content'
                       }}>
                          <Box sx={{ w: 6, h: 6, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 1.5s infinite' }} />
                          <Typography variant="caption" sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.5625rem', letterSpacing: '0.05em' }}>
                            In Range
                          </Typography>
                       </Box>
                    </TableCell>

                    {/* Action buttons */}
                    <TableCell sx={{ py: 2.5, pr: 4, textAlign: 'right' }}>
                       <Box 
                         className="action-buttons"
                         sx={{ 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'flex-end', 
                           gap: 1, 
                           opacity: { xs: 1, md: 0 }, 
                           transform: { xs: 'none', md: 'translateX(8px)' }, 
                           transition: 'all 0.2s ease' 
                         }}
                       >
                          <IconButton 
                            onClick={() => onSelectCow(cow.cowId)}
                            sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <Eye size={16} className="text-gray-400" />
                          </IconButton>
                          <IconButton 
                            onClick={() => { 
                              setEditingCow(cow); 
                              setFormCowId(cow.cowId);
                              setFormName(cow.name);
                              setFormBreed(cow.breed);
                              setFormGender(cow.gender);
                              setFormBirthDate(new Date(cow.birthDate).toISOString().split('T')[0]);
                              setFormImage(cow.image || '');
                              setIsModalOpen(true); 
                            }}
                            sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <Edit3 size={16} className="text-gray-400" />
                          </IconButton>
                          <IconButton 
                            onClick={() => onDeleteCow(cow.cowId)}
                            sx={{ p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'error.lighter', color: 'error.main' } }}
                          >
                            <Trash2 size={16} className="text-gray-400" />
                          </IconButton>
                       </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal Dialog Form */}
      <Dialog 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, p: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, px: 3, pt: 2, pb: 1, fontSize: '1.25rem' }}>
          {editingCow ? 'Edit Cattle Entity' : 'Register New Entity'}
        </DialogTitle>
        
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
             <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                    Cattle Tag ID
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={formCowId} 
                    onChange={e => setFormCowId(e.target.value)} 
                    placeholder="e.g. KH-999"
                    InputProps={{ sx: { borderRadius: 2.5, fontWeight: 'bold' } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                    Given Name
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    placeholder="e.g. Bella"
                    InputProps={{ sx: { borderRadius: 2.5, fontWeight: 'bold' } }}
                  />
                </Grid>
             </Grid>

             <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                    Breed / Classification
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select 
                      value={formBreed} 
                      onChange={e => setFormBreed(e.target.value)}
                      sx={{ borderRadius: 2.5, fontWeight: 'bold' }}
                    >
                      <MenuItem value="Brahman">Brahman</MenuItem>
                      <MenuItem value="Angus">Angus</MenuItem>
                      <MenuItem value="Hereford">Hereford</MenuItem>
                      <MenuItem value="Holstein">Holstein</MenuItem>
                      <MenuItem value="Local Mixed">Local Mixed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                    Gender
                  </Typography>
                  <Box sx={{ display: 'flex', bgcolor: 'action.hover', p: 0.5, borderRadius: 2.5 }}>
                     <Button 
                       type="button" 
                       onClick={() => setFormGender('Female')}
                       fullWidth
                       sx={{
                         py: 1,
                         borderRadius: 2,
                         textTransform: 'uppercase',
                         fontSize: '0.625rem',
                         fontWeight: 900,
                         bgcolor: formGender === 'Female' ? 'background.paper' : 'transparent',
                         color: formGender === 'Female' ? 'primary.main' : 'text.disabled',
                         boxShadow: formGender === 'Female' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                         '&:hover': { bgcolor: formGender === 'Female' ? 'background.paper' : 'transparent' }
                       }}
                     >
                       Female
                     </Button>
                     <Button 
                       type="button" 
                       onClick={() => setFormGender('Male')}
                       fullWidth
                       sx={{
                         py: 1,
                         borderRadius: 2,
                         textTransform: 'uppercase',
                         fontSize: '0.625rem',
                         fontWeight: 900,
                         bgcolor: formGender === 'Male' ? 'background.paper' : 'transparent',
                         color: formGender === 'Male' ? 'primary.main' : 'text.disabled',
                         boxShadow: formGender === 'Male' ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                         '&:hover': { bgcolor: formGender === 'Male' ? 'background.paper' : 'transparent' }
                       }}
                     >
                       Male
                     </Button>
                  </Box>
                </Grid>
             </Grid>

             <Box sx={{ width: '100%' }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
                  Date of Birth
                </Typography>
                <TextField 
                  fullWidth 
                  type="date"
                  size="small" 
                  value={formBirthDate} 
                  onChange={e => setFormBirthDate(e.target.value)} 
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                        <Calendar size={16} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5, fontWeight: 'bold' } 
                  }}
                />
             </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
            <Button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              variant="text"
              color="inherit"
              sx={{ fontWeight: 'bold', textTransform: 'none', px: 3, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ fontWeight: 'bold', textTransform: 'none', px: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(46, 125, 50, 0.15)' }}
            >
              Commit to Records
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
