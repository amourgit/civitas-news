// ============================================================
// src/components/home/organisations/OrganisationCard.tsx
// Carte "Organisation" — structure, refs, animations et logique
// COPIÉES du composant fourni (photo + glow flouté, liste cliquable
// avec panneau de détail qui glisse depuis la ligne cliquée, bio en
// panneau plein qui se déploie via un bouton "+") : rien n'a été
// redessiné. Seules les DONNÉES changent : artiste -> Organisation,
// morceaux -> News récentes de cette organisation (voir useNewsList).
//
// Comme dans le composant d'origine, seule la PREMIÈRE ligne de la
// liste est cliquable (ref + onClick) ; les suivantes restent des
// lignes d'affichage simple, à l'identique du code fourni.
//
// Correctif apporté au calcul de position du panneau : la formule
// d'origine mélangeait getBoundingClientRect() (relatif au viewport)
// et offsetTop (relatif à l'offsetParent) -- deux référentiels
// différents, qui ne coïncident que dans un contexte plein page precis.
// Une fois la carte imbriquée dans une page qui défile (notre cas),
// cela plaçait le panneau hors de la carte, invisible. Recalculé pour
// rester dans le même référentiel (deux rects viewport soustraits l'un
// à l'autre) -- comportement et déclenchement inchangés, seule la
// position obtenue est désormais correcte.
//
// CSS compagnon : OrganisationCard.css (voir ce fichier — la version
// fournie référençait des classes sans feuille de style jointe ;
// celle-ci a été écrite pour reproduire fidèlement le comportement
// décrit par le JS : glow flouté derrière la pochette, panneau de
// morceau qui glisse en place, panneau bio qui se déploie avec voile
// et flou progressif en bas de texte).
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { useNewsList } from '../../../features/news/hooks/useNewsList';
import { formatDateRelative } from '../../../lib/formatDate';
import { TYPE_ORGANISATION_LABELS, type Organisation, type TypeOrganisation } from '../../../types/global.types';
import './OrganisationCard.css';

const MoreOptionsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10C3.9 10 3 10.9 3 12C3 13.1 3.9 14 5 14C6.1 14 7 13.1 7 12C7 10.9 6.1 10 5 10ZM19 10C17.9 10 17 10.9 17 12C17 13.1 17.9 14 19 14C20.1 14 21 13.1 21 12C21 10.9 20.1 10 19 10ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10Z" fill="white" />
  </svg>
);

const AddIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.667 11.666H5.66699M11.667 5.66602V17.666" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M19.0696 4.83911C19 4.76937 18.9173 4.71405 18.8262 4.67631C18.7352 4.63857 18.6376 4.61914 18.539 4.61914C18.4405 4.61914 18.3429 4.63857 18.2518 4.67631C18.1608 4.71405 18.078 4.76937 18.0084 4.83911L17.3544 5.49311C16.9344 5.29256 16.4625 5.22721 16.0038 5.30606C15.5451 5.38491 15.1221 5.60407 14.7931 5.93336L6.83789 13.8879L11.0806 18.1306L19.0366 10.1769C19.3658 9.84782 19.5848 9.42481 19.6635 8.9661C19.7423 8.50738 19.6768 8.03555 19.4761 7.61561L20.1309 6.96086C20.2715 6.82021 20.3505 6.62948 20.3505 6.43061C20.3505 6.23173 20.2715 6.041 20.1309 5.90036L19.0696 4.83911ZM15.8686 11.2216L11.0806 16.0096L8.95964 13.8879L13.7469 9.10061L15.8686 11.2216ZM17.2321 9.85811L17.9746 9.11561C18.0444 9.04595 18.0997 8.96323 18.1374 8.87219C18.1752 8.78114 18.1946 8.68354 18.1946 8.58498C18.1946 8.48642 18.1752 8.38882 18.1374 8.29778C18.0997 8.20673 18.0444 8.12401 17.9746 8.05436L16.9149 6.99386C16.8452 6.92412 16.7625 6.8688 16.6715 6.83106C16.5804 6.79332 16.4828 6.77389 16.3843 6.77389C16.2857 6.77389 16.1881 6.79332 16.0971 6.83106C16.006 6.8688 15.9233 6.92412 15.8536 6.99386L15.1111 7.73636L17.2321 9.85811Z" fill="white" fillOpacity="0.45" />
    <path d="M4.62207 20.3315L6.21357 14.498L10.4556 18.7408L4.62207 20.3315Z" fill="white" fillOpacity="0.45" />
  </svg>
);

const MusicIcon = () => (
  <svg style={{ marginLeft: '40px' }} width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.70039 20.1004C5.20539 20.1004 4.78179 19.9243 4.42959 19.5721C4.07739 19.2199 3.90099 18.796 3.90039 18.3004V5.70039C3.90039 5.20539 4.07679 4.78179 4.42959 4.42959C4.78239 4.07739 5.20599 3.90099 5.70039 3.90039H18.3004C18.7954 3.90039 19.2193 4.07679 19.5721 4.42959C19.9249 4.78239 20.101 5.20599 20.1004 5.70039V18.3004C20.1004 18.7954 19.9243 19.2193 19.5721 19.5721C19.2199 19.9249 18.796 20.101 18.3004 20.1004H5.70039ZM5.70039 18.3004H8.62539V14.2504H8.40039C8.14539 14.2504 7.93179 14.164 7.75959 13.9912C7.58739 13.8184 7.50099 13.6048 7.50039 13.3504V5.70039H5.70039V18.3004ZM15.3754 18.3004H18.3004V5.70039H16.5004V13.3504C16.5004 13.6054 16.414 13.8193 16.2412 13.9921C16.0684 14.1649 15.8548 14.251 15.6004 14.2504H15.3754V18.3004ZM9.97539 18.3004H14.0254V14.2504H13.8004C13.5454 14.2504 13.3318 14.164 13.1596 13.9912C12.9874 13.8184 12.901 13.6048 12.9004 13.3504V5.70039H11.1004V13.3504C11.1004 13.6054 11.014 13.8193 10.8412 13.9921C10.6684 14.1649 10.4548 14.251 10.2004 14.2504H9.97539V18.3004Z" fill="white" fillOpacity="0.45" />
  </svg>
);

const GradientBlur = () => (
  <div className="gradient-blur">
    {[...Array(8)].map((_, i) => <div key={i}></div>)}
  </div>
);

/** Pochette / logo avec le même glow flouté qu'en original -- pochette
 * réelle en double exemplaire (net + flou en arrière-plan) si un logo
 * existe, sinon un dégradé de secours avec l'initiale de l'organisation. */
const OrganisationPhoto: React.FC<{ organisation: Organisation }> = ({ organisation }) => {
  if (organisation.logo) {
    return (
      <div className="photo-wrapper">
        <img className="photo" src={organisation.logo} alt={`Logo ${organisation.nom}`} />
        <img
          className="photo"
          style={{ filter: 'brightness(1.5) saturate(1) blur(48px)', zIndex: 'auto' }}
          src={organisation.logo}
          alt=""
        />
      </div>
    );
  }
  return (
    <div className="photo-wrapper">
      <div className="photo photo-fallback">{organisation.nom.charAt(0).toUpperCase()}</div>
    </div>
  );
};

export const OrganisationCard: React.FC<{ organisation: Organisation }> = ({ organisation }) => {
  const [isOrgModalActive, setIsOrgModalActive] = useState(false);
  const [isNewsModalActive, setIsNewsModalActive] = useState(false);
  const [newsModalTop, setNewsModalTop] = useState(0);
  const [newsModalTransform, setNewsModalTransform] = useState('translateY(0px)');

  const contentRef = useRef<HTMLDivElement>(null);
  const newsOpenRef = useRef<HTMLDivElement>(null);

  const anyModalActive = isOrgModalActive || isNewsModalActive;

  const { newsList, isLoading } = useNewsList({ organisationId: organisation.id });
  const displayNews = newsList.slice(0, 7);
  const featuredNews = displayNews[0];

  useEffect(() => {
    const updateNewsModalPosition = () => {
      if (newsOpenRef.current && contentRef.current) {
        const rowRect = newsOpenRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();
        setNewsModalTop(rowRect.top - contentRect.top - 2);
      }
    };

    updateNewsModalPosition();
    window.addEventListener('resize', updateNewsModalPosition);

    return () => {
      window.removeEventListener('resize', updateNewsModalPosition);
    };
  }, [displayNews.length]);

  const handleOrgToggle = () => {
    setIsOrgModalActive(!isOrgModalActive);
  };

  const handleNewsOpen = () => {
    if (newsOpenRef.current && contentRef.current) {
      const rowRect = newsOpenRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      setNewsModalTop(rowRect.top - contentRect.top - 2);
    }
    setNewsModalTransform('translateY(0px)');
    setIsNewsModalActive(true);
  };

  const handleNewsClose = () => {
    setNewsModalTransform('translateY(0px)');
    setIsNewsModalActive(false);
  };

  const typeLabel = TYPE_ORGANISATION_LABELS[organisation.type as TypeOrganisation] ?? organisation.type;
  const creationYear = organisation.creeLe ? new Date(organisation.creeLe).getFullYear() : null;

  return (
    <main className="organisation-card">
      <div className="content-wrapper">
        <div ref={contentRef} className={`content ${anyModalActive ? 'active' : ''}`}>
          <div className="main-content">
            <OrganisationPhoto organisation={organisation} />

            <div className="main-info">
              <div className="title-container">
                <h1>{organisation.nom}</h1>
                <div className="title-info">
                  <p className="light">{typeLabel}</p>
                  <div className="divider"></div>
                  <p className="light">{isLoading ? '…' : `${newsList.length} actu${newsList.length > 1 ? 's' : ''}`}</p>
                  {creationYear && (
                    <>
                      <div className="divider"></div>
                      <p className="light">{creationYear}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="songs">
                {isLoading ? (
                  <div className="song"><p className="light">Chargement des actualités…</p></div>
                ) : displayNews.length === 0 ? (
                  <div className="song"><p className="light">Aucune actualité publiée pour le moment</p></div>
                ) : (
                  displayNews.map((news, index) =>
                    index === 0 ? (
                      <div ref={newsOpenRef} key={news.id} className="song" onClick={handleNewsOpen}>
                        <p className="bold">{news.titre}</p>
                        <div className="end">
                          <MoreOptionsIcon />
                          <p className="light">{formatDateRelative(news.createdAt)}</p>
                        </div>
                      </div>
                    ) : (
                      <div key={news.id} className="song">
                        <p className="bold">{news.titre}</p>
                        <p className="light">{formatDateRelative(news.createdAt)}</p>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>

          {featuredNews && (
            <div className={`song-modal ${isNewsModalActive ? 'active' : ''}`} style={{ top: `${newsModalTop}px`, transform: newsModalTransform }}>
              <div className="song">
                <p className="bold">{featuredNews.titre}</p>
                <div className="end">
                  <div onClick={handleNewsClose}><AddIcon /></div>
                  <p className="light">{formatDateRelative(featuredNews.createdAt)}</p>
                </div>
              </div>
              <div className="song-modal-info">
                <div className="song-credits">
                  <EditIcon />
                  <p className="light">{featuredNews.auteur.nomAffiche}</p>
                  <MusicIcon />
                  <p className="light">{featuredNews.categorie.nom}</p>
                </div>
                <br />
                <p className="bold">{featuredNews.description}</p>
                {featuredNews.contenu && (
                  <>
                    <br />
                    <p className="bold">{featuredNews.contenu}</p>
                  </>
                )}
              </div>
              <GradientBlur />
            </div>
          )}

          <div className={`modal ${isOrgModalActive ? 'active' : ''}`} style={{ display: isNewsModalActive ? 'none' : 'flex' }}>
            <div className="toggle" onClick={handleOrgToggle}>
              <AddIcon />
            </div>
            <div className="modal-content">
              <div className="photo-wrapper">
                <h1>{organisation.nom}</h1>
                <OrganisationPhoto organisation={organisation} />
              </div>
              <div className="info">
                <div className="info-top">
                  <div className="info-top-left">
                    <p className="genre light">{typeLabel}</p>
                    <div className="divider"></div>
                    <p className="light">{newsList.length} actu{newsList.length > 1 ? 's' : ''}</p>
                  </div>
                  {creationYear && <p className="light">Depuis {creationYear}</p>}
                </div>
                <p className="bold">
                  {organisation.description || `${organisation.nom} n'a pas encore renseigné de description.`}
                </p>
              </div>
            </div>
            <GradientBlur />
            <div className="shade"></div>
          </div>
        </div>
      </div>
    </main>
  );
};
