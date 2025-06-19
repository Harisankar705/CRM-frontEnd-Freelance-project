import * as React from 'react'
import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import { Iconify } from 'src/components/iconify'
import axiosInstance from 'src/configs/axiosInstance'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import '../../global.css'
import { TextField, Container, MenuItem, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 900,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4
}

export default function QualityCheckForm ({ setUpdate, batches, products }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const [formData, setFormData] = useState({
    batchNumber: '',
    materialName: '',
    materialCode: '',
    inspectionDate: '',
    inspectorName: '',
    qualityStatus: '',
    comments: ''
  })
  const [parameterRows, setParameterRows] = useState([])
  const [errors, setErrors] = useState({})

  // Fetch QC parameters for the selected material
  useEffect(() => {
    if (formData.materialName) {
      // Replace with your API endpoint to get QC parameters for this material
      axiosInstance
        .get(`/qc-parameters?materialName=${formData.materialName}`)
        .then(res => {
          const params = res.data || []
          // Add fields for user input (actualResult, remarks)
          setParameterRows(params.map(row => ({
            ...row,
            actualResult: '',
            remarks: '',
            status: ''
          })))
        })
        .catch(() => setParameterRows([]))
    } else {
      setParameterRows([])
    }
  }, [formData.materialName])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.batchNumber)
      newErrors.batchNumber = 'Batch Number is required'
    if (!formData.materialName)
      newErrors.materialName = 'Material Name is required'
    if (!formData.materialCode)
      newErrors.materialCode = 'Material Code is required'
    if (!formData.inspectionDate)
      newErrors.inspectionDate = 'Inspection Date is required'
    if (!formData.inspectorName)
      newErrors.inspectorName = 'Inspector Name is required'
    if (!formData.qualityStatus)
      newErrors.qualityStatus = 'Quality Status is required'
    if (!formData.comments) newErrors.comments = 'Comments is required'
    parameterRows.forEach((param, idx) => {
      if (param.actualResult === '' || isNaN(param.actualResult)) {
        newErrors[`param_${idx}_actualResult`] = 'Required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Simple pass/fail logic based on min/max
  const calcStatus = (actual, min, max) => {
    if (actual === '' || isNaN(actual)) return ''
    return Number(actual) >= Number(min) && Number(actual) <= Number(max) ? 'PASS' : 'FAIL'
  }

  const handleParameterChange = (index, field, value) => {
    setParameterRows(prev =>
      prev.map((param, idx) =>
        idx === index
          ? {
              ...param,
              [field]: value,
              status:
                field === 'actualResult'
                  ? calcStatus(value, param.minRange, param.maxRange)
                  : param.status
            }
          : param
      )
    )
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleMaterialChange = event => {
    const selectedMaterial = event.target.value
    const isSelectedMaterial = batches.find(
      batch => selectedMaterial === batch.materialName
    )
    if (isSelectedMaterial) {
      setFormData({
        ...formData,
        materialName: selectedMaterial,
        batchNumber: isSelectedMaterial.batchNumber,
        materialCode: isSelectedMaterial.materialCode
      })
    }
  }

  const handleMaterialCodeChange = event => {
    const selectedMaterialCode = event.target.value
    const isSelectedMaterialCode = batches.find(
      batch => selectedMaterialCode === batch.materialCode
    )
    if (isSelectedMaterialCode) {
      setFormData({
        ...formData,
        materialCode: selectedMaterialCode,
        batchNumber: isSelectedMaterialCode.batchNumber,
        materialName: isSelectedMaterialCode.materialName
      })
    }
  }

  const handleBatchChange = event => {
    const selectedBatch = event.target.value
    const isSelectedBatch = batches.find(
      batch => selectedBatch === batch.batchNumber
    )
    if (isSelectedBatch) {
      setFormData({
        ...formData,
        materialName: isSelectedBatch.materialName,
        batchNumber: selectedBatch,
        materialCode: isSelectedBatch.materialCode
      })
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    try {
      const result = await axiosInstance.post('/newQualityCheck', formData)
      const qcId = result.data.qcId 
      await Promise.all(
        parameterRows.map(param =>
          axiosInstance.post('/newQualityCheckParameterResult', {
            qualityCheck: qcId,
            parameter: param._id,
            actualResult: param.actualResult,
            status: param.status,
            remarks: param.remarks
          })
        )
      )
      toast.success('Quality Check and Parameters saved successfully!')
      handleClose()
      setFormData({
        batchNumber: '',
        materialName: '',
        materialCode: '',
        inspectionDate: '',
        inspectorName: '',
        qualityStatus: '',
        comments: ''
      })
      setParameterRows([])
      setUpdate(prev => !prev)
    } catch (err) {
      toast.error('Error saving Quality Check')
      console.error('Error:', err.message)
    }
  }

  return (
    <div>
      <Toaster position='top-center' reverseOrder={false} />
      <Button
        onClick={handleOpen}
        variant='contained'
        color='inherit'
        startIcon={<Iconify icon='mingcute:add-line' />}
      >
        New Quality Check
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <Container maxWidth='lg'>
            <Paper elevation={4} sx={{ p: 5, backgroundColor: '#f9f9f9', borderRadius: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography component='h1' variant='h5' fontWeight='bold' color='primary' gutterBottom>
                  Add New Quality Check
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Quality Check Management
                </Typography>
              </Box>
              <Box component='form' onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      select
                      label='Material Name'
                      name='materialName'
                      value={formData.materialName}
                      onChange={handleMaterialChange}
                      error={!!errors.materialName}
                      helperText={errors.materialName}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      {batches.map((batch, index) => (
                        <MenuItem key={index} value={batch.materialName}>
                          {batch.materialName}
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => navigate('/vendor-stock-management/current-stock')}
                        sx={{ fontStyle: 'italic' }}
                      >
                        Add New Material In Current Stock +
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      select
                      label='Material Code'
                      name='materialCode'
                      value={formData.materialCode}
                      onChange={handleMaterialCodeChange}
                      error={!!errors.materialCode}
                      helperText={errors.materialCode}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      {batches.map((batch, index) => (
                        <MenuItem key={index} value={batch.materialCode}>
                          {batch.materialCode}
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => navigate('/vendor-stock-management/current-stock')}
                        sx={{ fontStyle: 'italic' }}
                      >
                        Add New Material Code +
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      select
                      label='Batch Number'
                      name='batchNumber'
                      value={formData.batchNumber}
                      onChange={handleBatchChange}
                      error={!!errors.batchNumber}
                      helperText={errors.batchNumber}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      {batches.map((batch, index) => (
                        <MenuItem key={index} value={batch.batchNumber}>
                          {batch.batchNumber}
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => navigate('/vendor-stock-management/current-stock')}
                        sx={{ fontStyle: 'italic' }}
                      >
                        Add New Batch +
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label='Inspection Date'
                      name='inspectionDate'
                      type='date'
                      value={formData.inspectionDate}
                      onChange={handleChange}
                      error={!!errors.inspectionDate}
                      helperText={errors.inspectionDate}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label='Inspector Name'
                      name='inspectorName'
                      value={formData.inspectorName}
                      onChange={handleChange}
                      error={!!errors.inspectorName}
                      helperText={errors.inspectorName}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      select
                      label='Quality Status'
                      name='qualityStatus'
                      value={formData.qualityStatus}
                      onChange={handleChange}
                      error={!!errors.qualityStatus}
                      helperText={errors.qualityStatus}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      <MenuItem value='Accepted' sx={{ color: 'green' }}>
                        Accepted
                      </MenuItem>
                      <MenuItem sx={{ color: 'purple' }} value='Quarantine'>
                        Quarantine
                      </MenuItem>
                      <MenuItem sx={{ color: 'red' }} value='Rejected'>
                        Rejected
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label='Comments'
                      name='comments'
                      value={formData.comments}
                      onChange={handleChange}
                      error={!!errors.comments}
                      helperText={errors.comments}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  {/* Table/grid for QC parameters */}
                  <Grid item xs={12}>
                    <Typography variant='h6' sx={{ mt: 2 }}>
                      Quality Parameters
                    </Typography>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Parameter Name</TableCell>
                            <TableCell>Method of Analysis</TableCell>
                            <TableCell>Min</TableCell>
                            <TableCell>Max</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell>Actual Result</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Remarks</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {parameterRows.map((param, idx) => (
                            <TableRow key={param._id || idx}>
                              <TableCell>{param.parameterName}</TableCell>
                              <TableCell>{param.methodOfAnalysis}</TableCell>
                              <TableCell>{param.minRange}</TableCell>
                              <TableCell>{param.maxRange}</TableCell>
                              <TableCell>{param.unit}</TableCell>
                              <TableCell>
                                <TextField
                                  type='number'
                                  size='small'
                                  value={param.actualResult}
                                  onChange={e =>
                                    handleParameterChange(idx, 'actualResult', e.target.value)
                                  }
                                  error={!!errors[`param_${idx}_actualResult`]}
                                  helperText={errors[`param_${idx}_actualResult`] || ''}
                                  inputProps={{ style: { width: 70 } }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography color={param.status === 'PASS' ? 'green' : 'red'}>
                                  {param.status}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size='small'
                                  value={param.remarks}
                                  onChange={e =>
                                    handleParameterChange(idx, 'remarks', e.target.value)
                                  }
                                  inputProps={{ style: { width: 120 } }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
                <Button
                  type='submit'
                  fullWidth
                  variant='contained'
                  sx={{
                    mt: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    background: 'linear-gradient(90deg, #4a90e2, #3b5998)',
                    color: 'white',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.3)',
                      background: 'linear-gradient(90deg, #3b5998, #4a90e2)'
                    }
                  }}
                >
                  Submit
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      </Modal>
    </div>
  )
}