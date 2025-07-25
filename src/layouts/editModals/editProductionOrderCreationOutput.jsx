import * as React from 'react'
import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import { Iconify } from 'src/components/iconify'
import axiosInstance from 'src/configs/axiosInstance'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import '../../global.css'
import { TextField, Container, MenuItem, Grid, Paper, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxWidth: '95vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto'
}

export default function EditProductionOrderCreationOutputForm ({
  batches,
  setUpdate,
  productionOrderOutputData,
  products
}) {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const navigate = useNavigate();
  const formattedDate = productionOrderOutputData.productionCompletionDate
    ? new Date(productionOrderOutputData.productionCompletionDate)
        .toISOString()
        .split('T')[0]
    : ''
  const [formData, setFormData] = useState({
    authPassword: '',
    productionOrderoutputId: productionOrderOutputData.productionOrderoutputId,
    productName: productionOrderOutputData.productName,
    producedQuantity: productionOrderOutputData.producedQuantity,
    productionCompletionDate: formattedDate,
    storageLocationforOutput: productionOrderOutputData.storageLocationforOutput,
    batchNumberforOutput: productionOrderOutputData.batchNumberforOutput,
    productionNotes: productionOrderOutputData.productionNotes,
    Yield: productionOrderOutputData.Yield,
    outputQualityRating: productionOrderOutputData.outputQualityRating,
    outputHandlingInstructions: productionOrderOutputData.outputHandlingInstructions,
    packingMaterials: productionOrderOutputData.packingMaterials && Array.isArray(productionOrderOutputData.packingMaterials)
      ? productionOrderOutputData.packingMaterials.map((pm) => ({
          type: pm.type || '',
          quantity: pm.quantity || '',
          unit: pm.unit || ''
        }))
      : [{ type: '', quantity: '', unit: '' }]
  })

  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.authPassword)
      newErrors.authPassword = 'Authorization Password is required'
    if (!formData.producedQuantity) {
      newErrors.producedQuantity = 'Produced Quantity is required';
    } else if (!/^\d+(\.\d+)?$/.test(formData.producedQuantity)) {
      newErrors.producedQuantity = 'Produced Quantity must be a valid number';
    }
    if (!formData.productName)
      newErrors.productName = 'Product Name is required'
    if (!formData.productionCompletionDate)
      newErrors.productionCompletionDate = 'Production Completion Date is required'
    if (!formData.storageLocationforOutput)
      newErrors.storageLocationforOutput = 'Storage Location for Output is required'
    if (!formData.productionNotes)
      newErrors.productionNotes = 'Production Notes is required'
    if (!formData.Yield) {
      newErrors.Yield = 'Yield is required';
    } else if (!/^\d+(\.\d+)?$/.test(formData.Yield)) {
      newErrors.Yield = 'Yield must be a valid number';
    }
    if (!formData.outputQualityRating)
      newErrors.outputQualityRating = 'Output Quality Rating is required'
    if (!formData.outputHandlingInstructions)
      newErrors.outputHandlingInstructions = 'Output Handling Instructions is required'
    // Packing materials validation
    formData.packingMaterials.forEach((material, idx) => {
      if (!material.type) {
        newErrors[`packingMaterials[${idx}].type`] = 'Type is required';
      }
      if (!material.quantity) {
        newErrors[`packingMaterials[${idx}].quantity`] = 'Quantity is required';
      } else if (!/^\d+(\.\d+)?$/.test(material.quantity)) {
        newErrors[`packingMaterials[${idx}].quantity`] = 'Quantity must be a valid number';
      }
      if (!material.unit) {
        newErrors[`packingMaterials[${idx}].unit`] = 'Unit is required';
      }
    });

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePackingMaterialChange = (e, idx) => {
    const { name, value } = e.target
    const updated = [...formData.packingMaterials]
    updated[idx][name] = value
    setFormData(prev => ({ ...prev, packingMaterials: updated }))
  }

  const addPackingMaterial = () => {
    setFormData(prev => ({
      ...prev,
      packingMaterials: [...prev.packingMaterials, { type: '', quantity: '', unit: '' }]
    }))
  }

  const removePackingMaterial = index => {
    const updated = formData.packingMaterials.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, packingMaterials: updated }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      await axiosInstance
        .put('/editProductionOrderCreationOutput', formData)
        .then(result => {
          toast.success(result.data.message)
          handleClose()
          setFormData({
            authPassword: '',
            productionOrderOutputId: '',
            productName:'',
            producedQuantity: '',
            productionCompletionDate: '',
            storageLocationforOutput: '',
            batchNumberforOutput: '',
            productionNotes: '',
            Yield: '',
            outputQualityRating: '',
            outputHandlingInstructions: '',
            packingMaterials: [{ type: '', quantity: '', unit: '' }]
          })
          setUpdate(prev => !prev)
        })
        .catch(err => {
          toast.error(err.response.data.message)
          console.error(
            'Error occured in editing production order in client side',
            err.message
          )
        })
    } catch (err) {
      console.error(
        'Error occured in editing production orderin client side',
        err.message
      )
    }
  }

  return (
    <div>
      <Toaster position='top-center' reverseOrder={false} />
      <MenuItem onClick={handleOpen}>
        <Iconify icon='solar:pen-bold' />
        Edit
      </MenuItem>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box sx={style}>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Container maxWidth='lg'>
            <Paper
              elevation={4}
              sx={{ p: 5, backgroundColor: '#f9f9f9', borderRadius: 2 }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography
                  component='h1'
                  variant='h5'
                  fontWeight='bold'
                  color='primary'
                  gutterBottom
                >
                  Edit Production Order Creation Output Details
                </Typography>
                <Typography variant='body2' color='textSecondary'>
                  Production Order Creation Management
                </Typography>
              </Box>
              <Box component='form' onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      select
                      label='Product Name'
                      name='productName'
                      value={formData.productName}
                      onChange={handleChange}
                      error={!!errors.productName}
                      helperText={errors.productName}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      {products.map((product, index) => (
                        <MenuItem key={index} value={product}>
                          {product}
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => navigate('/production-workflow/production-order-creation')}
                        sx={{ fontStyle: 'italic' }} 
                      >
                        Add New Product +
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Authorization Password'
                      name='authPassword'
                      type='password'
                      value={formData.authPassword}
                      onChange={handleChange}
                      error={!!errors.authPassword}
                      helperText={errors.authPassword}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Produced Quantity'
                      name='producedQuantity'
                      value={formData.producedQuantity}
                      onChange={handleChange}
                      error={!!errors.producedQuantity}
                      helperText={errors.producedQuantity}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Production Completion Date'
                      name='productionCompletionDate'
                      type='date'
                      value={formData.productionCompletionDate}
                      onChange={handleChange}
                      error={!!errors.productionCompletionDate}
                      helperText={errors.productionCompletionDate}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Storage Location for Output'
                      name='storageLocationforOutput'
                      value={formData.storageLocationforOutput}
                      onChange={handleChange}
                      error={!!errors.storageLocationforOutput}
                      helperText={errors.storageLocationforOutput}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      select
                      label='Batch Number For Output'
                      name='batchNumberforOutput'
                      value={formData.batchNumberforOutput}
                      onChange={handleChange}
                      error={!!errors.batchNumberforOutput}
                      helperText={errors.batchNumberforOutput}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    >
                      {batches.map((batch, index) => (
                        <MenuItem key={index} value={batch}>
                          {batch}
                        </MenuItem>
                      ))}
                      <MenuItem
                        onClick={() => navigate('/production-workflow/production-order-creation')}
                        sx={{ fontStyle: 'italic' }} 
                      >
                        Add New Batch +
                      </MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Production Notes'
                      name='productionNotes'
                      value={formData.productionNotes}
                      onChange={handleChange}
                      error={!!errors.productionNotes}
                      helperText={errors.productionNotes}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Yield'
                      name='Yield'
                      value={formData.Yield}
                      onChange={handleChange}
                      error={!!errors.Yield}
                      helperText={errors.Yield}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Output Quality Rating'
                      name='outputQualityRating'
                      value={formData.outputQualityRating}
                      onChange={handleChange}
                      error={!!errors.outputQualityRating}
                      helperText={errors.outputQualityRating}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label='Output Handling Instructions'
                      name='outputHandlingInstructions'
                      value={formData.outputHandlingInstructions}
                      onChange={handleChange}
                      error={!!errors.outputHandlingInstructions}
                      helperText={errors.outputHandlingInstructions}
                      variant='outlined'
                      InputProps={{ style: { borderRadius: 8 } }}
                    />
                  </Grid>
                  {/* Packing Materials section */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                      Packing Materials
                    </Typography>
                  </Grid>
                  {formData.packingMaterials.map((material, idx) => (
                    <React.Fragment key={idx}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          label="Type"
                          name="type"
                          value={material.type}
                          onChange={e => handlePackingMaterialChange(e, idx)}
                          error={!!errors[`packingMaterials[${idx}].type`]}
                          helperText={errors[`packingMaterials[${idx}].type`]}
                          variant="outlined"
                          InputProps={{ style: { borderRadius: 8 } }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          name="quantity"
                          type="number"
                          value={material.quantity}
                          onChange={e => handlePackingMaterialChange(e, idx)}
                          error={!!errors[`packingMaterials[${idx}].quantity`]}
                          helperText={errors[`packingMaterials[${idx}].quantity`]}
                          variant="outlined"
                          InputProps={{ style: { borderRadius: 8 } }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          select
                          label="Unit"
                          name="unit"
                          value={material.unit}
                          onChange={e => handlePackingMaterialChange(e, idx)}
                          error={!!errors[`packingMaterials[${idx}].unit`]}
                          helperText={errors[`packingMaterials[${idx}].unit`]}
                          variant="outlined"
                          InputProps={{ style: { borderRadius: 8 } }}
                        >
                          {['KG', 'Gram', 'Litre', 'ML', 'Pieces'].map((unit) => (
                            <MenuItem key={unit} value={unit}>
                              {unit}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => removePackingMaterial(idx)} color="error">
                          <Iconify icon="mdi:delete-outline" />
                        </IconButton>
                      </Grid>
                    </React.Fragment>
                  ))}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="mdi:plus" />}
                      onClick={addPackingMaterial}
                    >
                      Add Packing Material
                    </Button>
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