import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSelector } from '@/components/SiteSelector';
import { useSiteContext } from '@/contexts/SiteContext';
import { sitesService } from '@/services/sites.service';
import type { Site } from '@/types/enhanced';

// Mock SiteContext
jest.mock('@/contexts/SiteContext', () => ({
  useSiteContext: jest.fn(),
}));

// Mock sites service
jest.mock('@/services/sites.service', () => ({
  sitesService: {
    createSite: jest.fn(),
  },
}));

const mockUseSiteContext = useSiteContext as jest.MockedFunction<typeof useSiteContext>;
const mockSitesService = sitesService as jest.Mocked<typeof sitesService>;

describe('SiteSelector', () => {
  const mockSetSelectedSite = jest.fn();
  const mockRefreshSites = jest.fn();
  const mockCreateSite = jest.fn();

  const mockSites: Site[] = [
    {
      id: 1,
      name: 'Test Site 1',
      domain: 'example1.com',
      displayName: 'Test Site 1',
      isActive: true,
      isConfigured: true,
      subscribersCount: 100,
      campaignsCount: 5,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    },
    {
      id: 2,
      name: 'Test Site 2',
      domain: 'example2.com',
      displayName: 'Test Site 2',
      isActive: true,
      isConfigured: true,
      subscribersCount: 200,
      campaignsCount: 10,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    },
    {
      id: 3,
      name: 'Test Site 3',
      domain: 'example3.com',
      displayName: 'Test Site 3',
      isActive: true,
      isConfigured: true,
      subscribersCount: 300,
      campaignsCount: 15,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSiteContext.mockReturnValue({
      selectedSite: mockSites[0],
      setSelectedSite: mockSetSelectedSite,
      sites: mockSites,
      loading: false,
      refreshSites: mockRefreshSites,
      createSite: mockCreateSite,
    });
  });

  it('renders site selector with current site', () => {
    render(<SiteSelector />);

    expect(screen.getByText('Test Site 1')).toBeInTheDocument();
    // El dominio no se muestra en la vista principal, solo en el dropdown
  });

  it('shows loading state when sites are loading', () => {
    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: mockSetSelectedSite,
      sites: [],
      loading: true,
      refreshSites: mockRefreshSites,
      createSite: mockCreateSite,
    });

    render(<SiteSelector />);

    // Verifica que hay un elemento de carga (div con animate-pulse)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteSelector />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Mis Sitios')).toBeInTheDocument();
      expect(screen.getByText('Test Site 2')).toBeInTheDocument();
      expect(screen.getByText('Test Site 3')).toBeInTheDocument();
    });
  });

  it('allows selecting a different site', async () => {
    const user = userEvent.setup();
    render(<SiteSelector />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Test Site 2')).toBeInTheDocument();
    });

    const site2Option = screen.getByText('Test Site 2');
    await user.click(site2Option);

    expect(mockSetSelectedSite).toHaveBeenCalledWith(mockSites[1]);
  });

  it('opens create site modal when "Añadir nuevo sitio" is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteSelector />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/añadir nuevo sitio/i)).toBeInTheDocument();
    });

    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Sitio')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/mi sitio web/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });
  });

  it('validates site creation form', async () => {
    const user = userEvent.setup();
    render(<SiteSelector />);

    // Open dropdown and create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Sitio')).toBeInTheDocument();
    });

    // Try to create without filling fields
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    // El botón debería estar deshabilitado sin llenar los campos
    expect(submitButton).toBeDisabled();
  });

  it('validates domain format', async () => {
    const user = userEvent.setup();

    // Mock window.alert to check validation
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'Test Site');
    await user.type(domainInput, 'invalid-domain-.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('El formato del dominio no es válido. Ejemplo: ejemplo.com');
    });

    alertSpy.mockRestore();
  });

  it('checks for duplicate domain', async () => {
    const user = userEvent.setup();

    // Mock window.alert to check validation
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'Duplicate Site');
    await user.type(domainInput, 'example1.com'); // Existing domain
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Ya tienes un sitio registrado con este dominio');
    });

    alertSpy.mockRestore();
  });

  it('creates new site successfully', async () => {
    const user = userEvent.setup();
    const newSite = {
      id: 4,
      name: 'New Site',
      domain: 'newsite.com',
      displayName: 'New Site',
      isActive: true,
      isConfigured: true,
      subscribersCount: 0,
      campaignsCount: 0,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    };

    // Mock window.alert to check success message
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    mockSitesService.createSite.mockResolvedValue({
      success: true,
      data: newSite
    });

    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'New Site');
    await user.type(domainInput, 'newsite.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSitesService.createSite).toHaveBeenCalledWith({
        name: 'New Site',
        domain: 'newsite.com',
        description: ''
      });
      expect(mockRefreshSites).toHaveBeenCalled();
      expect(mockSetSelectedSite).toHaveBeenCalledWith(newSite);
      expect(alertSpy).toHaveBeenCalledWith(`¡Sitio "New Site" creado exitosamente!`);
    });

    alertSpy.mockRestore();
  });

  it('handles site creation error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Domain already exists';

    // Mock window.alert to check error message
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    mockSitesService.createSite.mockRejectedValue(new Error(errorMessage));

    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'Error Site');
    await user.type(domainInput, 'errorsite.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(errorMessage);
    });

    alertSpy.mockRestore();
  });

  it('shows loading state during site creation', async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: any) => void;
    const createPromise = new Promise(resolve => {
      resolveCreate = resolve;
    });

    mockSitesService.createSite.mockReturnValue(createPromise as Promise<any>);

    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'Loading Site');
    await user.type(domainInput, 'loadingsite.com');
    await user.click(submitButton);

    expect(screen.getByText(/creando/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveCreate!({
      success: true,
      data: {
        id: 4,
        name: 'Loading Site',
        domain: 'loadingsite.com',
        displayName: 'Loading Site',
        isActive: true,
        isConfigured: true,
        subscribersCount: 0,
        campaignsCount: 0,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z'
      }
    });

    await waitFor(() => {
      expect(screen.queryByText(/creando/i)).not.toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<SiteSelector />);

    // Open create modal
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Sitio')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Crear Nuevo Sitio')).not.toBeInTheDocument();
    });
  });

  it('handles API error with status information', async () => {
    const user = userEvent.setup();
    const apiError = {
      status: 400,
      code: 'DOMAIN_EXISTS',
      message: 'Domain already exists',
      details: ['Domain validation failed']
    };

    // Mock window.alert to check error message
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => { });

    mockSitesService.createSite.mockRejectedValue(apiError);

    render(<SiteSelector />);

    // Open create modal and submit
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    const createButton = screen.getByText(/añadir nuevo sitio/i);
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ejemplo\.com/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByPlaceholderText(/mi sitio web/i);
    const domainInput = screen.getByPlaceholderText(/ejemplo\.com/i);
    const submitButton = screen.getByRole('button', { name: /crear sitio/i });

    await user.type(nameInput, 'API Error Site');
    await user.type(domainInput, 'apierror.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Ya tienes un sitio registrado con este dominio. Usa un dominio diferente.');
    });

    alertSpy.mockRestore();
  });

  it('displays "No tienes sitios" when sites array is empty', async () => {
    const user = userEvent.setup();

    mockUseSiteContext.mockReturnValue({
      selectedSite: null,
      setSelectedSite: mockSetSelectedSite,
      sites: [],
      loading: false,
      refreshSites: mockRefreshSites,
      createSite: mockCreateSite,
    });

    render(<SiteSelector />);

    // Click to open dropdown
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/no tienes sitios/i)).toBeInTheDocument();
    });
  });
});