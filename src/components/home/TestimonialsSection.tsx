import React from 'react';
import { Star, Quote, ArrowRight } from 'lucide-react';
import { TESTIMONIALS } from '../../assets/mockData';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Real People, Real Financial Growth
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            See how direct micro-lending empowers borrowers to achieve goals and gives lenders a transparent way to earn steady yield.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-soft flex flex-col justify-between"
            >
              <div>
                {/* Header with Role Pill & Rating */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      t.role === 'Borrower'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}
                  >
                    Verified {t.role}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Quote */}
                <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Details */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                  <div className="text-xs text-slate-600">{t.detail}</div>
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    {t.loanAmount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
