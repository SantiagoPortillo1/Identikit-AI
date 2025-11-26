'use client'
import { useState, useEffect, ChangeEvent, FormEvent } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Session} from '@supabase/supabase-js'

export default function Home() {
  interface FormData {
    fullName: string;
    description: string;
  }

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({ fullName: '', description: '' })
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 1. GESTIÓN DE SESIÓN (Login)
  useEffect(() => {
    // Ver si ya hay sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Escuchar cambios (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 2. SI NO HAY SESIÓN -> MOSTRAR LOGIN
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Identikit AI</h1>
            <p className="text-slate-600 mb-2">Sistema de generación de retratos actualizados</p>
            <p className="text-sm text-slate-500">
              Acceso restringido a personal autorizado
            </p>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <Auth 
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#2563eb',
                      brandAccent: '#1d4ed8',
                    },
                    radii: {
                      borderRadiusButton: '0.5rem',
                      buttonBorderRadius: '0.5rem',
                      inputBorderRadius: '0.5rem',
                    },
                  },
                },
              }}
              theme="light"
              providers={"Email"}
            />
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-500">
              Si tiene problemas para acceder, contacte al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 3. SI HAY SESIÓN -> MOSTRAR APP PRINCIPAL
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !formData.fullName) return alert('Por favor completa los datos.')

    try {
      setLoading(true)
      
      // A. SUBIR IMAGEN (Protegido por RLS)
      const fileExt = file.name.split('.').pop()
      const fileName = `caso-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('identikit-photos') // Asegúrate que tu bucket se llame así
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // B. OBTENER URL PÚBLICA
      const { data: { publicUrl } } = supabase.storage
        .from('identikit-photos')
        .getPublicUrl(fileName)

      console.log("Imagen subida:", publicUrl)
      
      alert(`✅ ¡Éxito! Foto subida por ${session.user.email}. URL: ${publicUrl}`)

    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10">
        <nav className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200">
          <div className='flex items-center gap-3'>
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Identikit AI</h1>
              <p className="text-sm text-slate-500">Sistema de generación de retratos actualizados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
              {session?.user?.email || 'Usuario'}
            </span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 transition-colors"
              title="Cerrar sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h2 className="text-2xl font-bold">Nuevo Caso de Persona Desaparecida</h2>
            <p className="text-blue-100 mt-1">Complete la información para generar un retrato actualizado</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre completo de la persona desaparecida
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  name="fullName" 
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ej. Juan Pérez García"
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descripción detallada
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  rows={4}
                  onChange={handleInputChange}
                  placeholder="Incluya detalles como: edad al momento de la desaparición, características físicas, vestimenta, marcas distintivas, etc."
                  className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fotografía más reciente
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-slate-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Subir archivo</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="sr-only"
                          required
                        />
                      </label>
                      <p className="pl-1">o arrastre y suelte</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF hasta 10MB</p>
                  </div>
                </div>
                
                {previewUrl && (
                  <div className="mt-4 flex flex-col items-center">
                    <p className="text-sm text-slate-500 mb-2">Vista previa:</p>
                    <div className="relative group">
                      <img 
                        src={previewUrl} 
                        alt="Vista previa de la imagen" 
                        className="h-48 w-auto object-contain rounded-lg border border-slate-200 shadow-sm"
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          setPreviewUrl(null);
                          setFile(null);
                          const input = document.getElementById('file-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar imagen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Generar Retrato Actualizado
                  </>
                )}
              </button>
              
              <p className="mt-3 text-center text-sm text-slate-500">
                Al continuar, acepta nuestros términos de servicio y política de privacidad.
              </p>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Identikit AI. Todos los derechos reservados.</p>
          <p className="mt-1">Sistema de apoyo para la búsqueda de personas desaparecidas</p>
        </footer>
      </main>
    </div>
  )
}