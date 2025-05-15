'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useForm } from 'react-hook-form'
import { uploadFile } from '@/lib/uploadFile'
import { ChevronRight, ChevronLeft, Check, X } from 'lucide-react' // Add lucide-react for icons

export default function ProfileCreatePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({ mode: 'onChange' })

  // Form steps configuration
  const steps = [
    { 
      title: "Basic Information", 
      description: "Enter your startup's fundamental details" 
    },
    { 
      title: "Contact Details", 
      description: "Who should we contact regarding this application?" 
    },
    { 
      title: "Business Information", 
      description: "Tell us about your business structure" 
    },
    { 
      title: "Product Details", 
      description: "Describe what your startup offers" 
    },
    { 
      title: "Final Details", 
      description: "Complete your profile setup" 
    }
  ]

  // Same authentication logic
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUserId(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
        setLoading(false);
      }
    );
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) {
        setUserId(data.user.id);
      }
      setLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      // Get current user ID directly from auth if state wasn't set
      let submissionUserId = userId;
      
      if (!submissionUserId) {
        console.log("Getting user ID directly from auth...");
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user?.id) {
          submissionUserId = userData.user.id;
          console.log("Retrieved user ID:", submissionUserId);
        } else {
          // Generate a proper UUID as fallback
          submissionUserId = crypto.randomUUID();
          console.log("Using generated UUID as fallback:", submissionUserId);
        }
      }

      let logo_url = null;
      if (data.logo?.[0]) {
        logo_url = await uploadFile(data.logo[0], 'logos', submissionUserId);
      }

      const payload = {
        user_id: submissionUserId,
        startup_name: data.startup_name,
        brand_name: data.brand_name || null,
        incorporation_date: data.incorporation_date, // Make sure this is included
        entity_type: data.entity_type,
        registration_number: data.registration_number,
        pan_number: data.pan_number,
        address: data.address,
        contact_name: data.contact_name,
        contact_role: data.contact_role,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        num_founders: Number(data.num_founders || 0),
        team_size: Number(data.team_size || 0),
        sector: data.sector,
        pitch: data.pitch,
        problem_statement: data.problem_statement,
        target_market: data.target_market, // Add this line
        stage: data.stage,
        business_model: data.business_model,
        product_description: data.product_description,
        products: data.products ? JSON.parse(data.products) : [],
        founders: data.founders ? JSON.parse(data.founders) : [],
        logo_url,
        terms_accepted: true,
        created_at: new Date().toISOString(),
      }

      console.log("Submitting with payload:", payload);
      
      const { error } = await supabase.from('startups').insert(payload);
      if (error) {
        throw new Error(error.message);
      }
      
      alert('Profile submitted successfully!');
      router.push('/directory');
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(`Error: ${error.message}`);
    }
  }

  // Navigation functions
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`relative flex flex-col items-center ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors
                  ${index < currentStep ? 'bg-blue-600 text-white' : 
                  index === currentStep ? 'border-2 border-blue-600 text-blue-600' : 
                  'border-2 border-gray-300 text-gray-300'}`}
              >
                {index < currentStep ? <Check size={18} /> : index + 1}
              </div>
              <div className="absolute -bottom-6 w-max text-xs font-medium">
                {step.title}
              </div>
            </div>
          ))}
        </div>
        {/* Connecting lines */}
        <div className="relative h-1 bg-gray-200 mt-5">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{steps[currentStep].title}</h1>
        <p className="text-gray-600">{steps[currentStep].description}</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name *</label>
                <input 
                  {...register('startup_name', { required: "Startup name is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your startup's official name"
                />
                {errors.startup_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.startup_name.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                <input 
                  {...register('brand_name')} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your trading or brand name (if different)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incorporation Date *</label>
                <input 
                  type="date" 
                  {...register('incorporation_date', { required: "Date is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
                {errors.incorporation_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.incorporation_date.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
                <select 
                  {...register('entity_type', { required: "Entity type is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select entity type</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Other">Other</option>
                </select>
                {errors.entity_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.entity_type.message?.toString()}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                <input 
                  {...register('registration_number', { required: "Registration number is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="CIN/LLPIN/Registration number"
                />
                {errors.registration_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.registration_number.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                <input 
                  {...register('pan_number', { required: "PAN number is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your company's PAN"
                />
                {errors.pan_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.pan_number.message?.toString()}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address *</label>
              <textarea 
                {...register('address', { required: "Address is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={3}
                placeholder="Full registered address as per documents"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message?.toString()}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Step 2: Contact Details */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Name *</label>
                <input 
                  {...register('contact_name', { required: "Contact name is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Full name of primary contact"
                />
                {errors.contact_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_name.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Role *</label>
                <select 
                  {...register('contact_role', { required: "Contact role is required" })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="Founder">Founder</option>
                  <option value="Co-founder">Co-founder</option>
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="CFO">CFO</option>
                  <option value="Other">Other</option>
                </select>
                {errors.contact_role && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_role.message?.toString()}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                <input 
                  type="email" 
                  {...register('contact_email', { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Email address"
                />
                {errors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_email.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                <input 
                  type="tel" 
                  {...register('contact_phone', { 
                    required: "Phone number is required" 
                  })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Contact phone number"
                />
                {errors.contact_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_phone.message?.toString()}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Business Information */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Founders *</label>
                <input 
                  type="number" 
                  {...register('num_founders', { 
                    required: "Number of founders is required",
                    min: { value: 1, message: "Must have at least 1 founder" }
                  })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="1"
                  min="1"
                />
                {errors.num_founders && (
                  <p className="mt-1 text-sm text-red-600">{errors.num_founders.message?.toString()}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Size *</label>
                <input 
                  type="number" 
                  {...register('team_size', { 
                    required: "Team size is required",
                    min: { value: 1, message: "Team size must be at least 1" }
                  })} 
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Total number of team members"
                  min="1"
                />
                {errors.team_size && (
                  <p className="mt-1 text-sm text-red-600">{errors.team_size.message?.toString()}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
              <select 
                {...register('sector', { required: "Sector is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select sector</option>
                <option value="Software">Software</option>
                <option value="FinTech">FinTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="EdTech">EdTech</option>
                <option value="E-commerce">E-commerce</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Hardware">Hardware</option>
                <option value="CleanTech">CleanTech</option>
                <option value="Other">Other</option>
              </select>
              {errors.sector && (
                <p className="mt-1 text-sm text-red-600">{errors.sector.message?.toString()}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
              <select 
                {...register('stage', { required: "Stage is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select stage</option>
                <option value="Idea">Idea</option>
                <option value="Prototype">Prototype</option>
                <option value="MVP">MVP</option>
                <option value="Pre-seed">Pre-seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Series B+">Series B+</option>
              </select>
              {errors.stage && (
                <p className="mt-1 text-sm text-red-600">{errors.stage.message?.toString()}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Model *</label>
              <select 
                {...register('business_model', { required: "Business model is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select business model</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
                <option value="B2B2C">B2B2C</option>
                <option value="D2C">D2C</option>
                <option value="Marketplace">Marketplace</option>
                <option value="SaaS">SaaS</option>
                <option value="Subscription">Subscription</option>
                <option value="Freemium">Freemium</option>
                <option value="Other">Other</option>
              </select>
              {errors.business_model && (
                <p className="mt-1 text-sm text-red-600">{errors.business_model.message?.toString()}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Step 4: Product Details */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Elevator Pitch *</label>
              <textarea 
                {...register('pitch', { 
                  required: "Elevator pitch is required",
                  maxLength: { value: 500, message: "Elevator pitch should be under 500 characters" }
                })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={3}
                placeholder="One-paragraph pitch explaining your startup"
              />
              <div className="flex justify-between">
                {errors.pitch && (
                  <p className="mt-1 text-sm text-red-600">{errors.pitch.message?.toString()}</p>
                )}
                <span className="text-sm text-gray-500 mt-1">
                  {watch('pitch')?.length || 0}/500
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement *</label>
              <textarea 
                {...register('problem_statement', { required: "Problem statement is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={3}
                placeholder="What problem are you solving?"
              />
              {errors.problem_statement && (
                <p className="mt-1 text-sm text-red-600">{errors.problem_statement.message?.toString()}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Market *</label>
              <textarea 
                {...register('target_market', { required: "Target market is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={3}
                placeholder="Describe your target audience or customer segments"
              />
              {errors.target_market && (
                <p className="mt-1 text-sm text-red-600">{errors.target_market.message?.toString()}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Description *</label>
              <textarea 
                {...register('product_description', { required: "Product description is required" })} 
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={4}
                placeholder="Describe your product/service in detail"
              />
              {errors.product_description && (
                <p className="mt-1 text-sm text-red-600">{errors.product_description.message?.toString()}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Step 5: Final Details */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h3 className="font-medium text-blue-700 mb-2">Adding Founders and Products</h3>
                <p className="text-sm text-blue-600">
                  For the following fields, please enter information in valid JSON format as shown in the examples.
                </p>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-1">Founders (JSON)</label>
              <textarea
                {...register('founders')}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder='[{"name":"Alice Smith","email":"alice@example.com","linkedin":"linkedin.com/in/alice","role":"CEO"},
{"name":"Bob Jones","email":"bob@example.com","linkedin":"linkedin.com/in/bob","role":"CTO"}]'
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: array of objects with name, email, linkedin, and role properties
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Products (JSON)</label>
              <textarea
                {...register('products')}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder='["Product A - Analytics Platform", "Product B - Mobile App"]'
              />
              <p className="text-xs text-gray-500 mt-1">Format: array of strings</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo Upload</label>
              <div className="mt-1 flex items-center">
                <div className="w-full rounded-md">
                  <input
                    type="file"
                    {...register('logo')}
                    className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    accept="image/*"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Recommended: square format, minimum 400x400px</p>
            </div>
            
            <div className="pt-4">
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium text-green-700 mb-2">Ready to Submit?</h3>
                <p className="text-sm text-green-600 mb-2">
                  Please review all information before submitting. You'll be able to edit your profile later.
                </p>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    className="h-4 w-4 text-blue-600 rounded"
                    {...register('terms_accepted', { required: "You must accept the terms" })}
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-green-700">
                    I confirm this information is accurate and complete
                  </label>
                </div>
                {errors.terms_accepted && (
                  <p className="mt-1 text-sm text-red-600">{errors.terms_accepted.message?.toString()}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            className={`px-4 py-2 rounded-md flex items-center ${currentStep > 0 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous
          </button>
          
          <div>
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                Next Step
                <ChevronRight size={16} className="ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                Submit
                <Check size={16} className="ml-1" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
