/**
 * Tarjeta de video (USER_FLOWS A.6).
 *
 * El video **no se incrusta al cargar la pagina**: la tarjeta muestra la
 * miniatura y un boton nativo «Reproducir», y solo al pulsarlo aparece el
 * `iframe` —*«al seleccionar uno, se reproduce mediante embed»*—. Asi un
 * listado de doce videos no descarga doce reproductores de terceros, y el
 * visitante decide cuando habla con el proveedor.
 *
 * El `iframe` solo existe si `urlDeEmbed` devuelve una URL: proveedor en la
 * lista cerrada **y** referencia con la forma exacta (decision D-014-C). Si
 * no, la tarjeta ofrece unicamente el enlace externo seguro, que existe
 * siempre.
 *
 * `id={slug}` en el `li`: no hay detalle de video, y un resultado de busqueda
 * llega aqui por `/videos#<slug>` (decision D-014-J).
 */
import { useState } from 'react';

import { nombreDeProveedor, urlDeEmbed } from './providers';
import { Button, Card, ExternalLink } from '../../components';
import { formatearDuracion } from '../../lib/format/duration';
import { RUTAS } from '../../lib/rutas';
import type { VideoDeListado } from '../../services/public/types';
import { PublishedDate } from '../content/PublishedDate';
import styles from '../content/tarjeta.module.css';
import { MediaImage } from '../media/MediaImage';
import { TagLinks } from '../tags/TagLinks';

export interface VideoCardProps {
  readonly video: VideoDeListado;
  readonly nivelDeTitulo?: 2 | 3;
}

export function VideoCard({ video, nivelDeTitulo = 2 }: VideoCardProps) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const Titulo = nivelDeTitulo === 3 ? 'h3' : 'h2';

  const embed = urlDeEmbed(video.provider, video.embed_reference);
  const proveedor = nombreDeProveedor(video.provider);
  const duracion = formatearDuracion(video.duration_seconds);

  return (
    <li id={video.slug} className={styles['item']}>
      <Card className={styles['tarjeta']}>
        <article className={styles['articulo']}>
          {reproduciendo && embed !== null ? (
            <iframe
              className={styles['embed']}
              src={embed}
              title={video.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <MediaImage medio={video.thumbnail} className={styles['imagen']} />
          )}

          <Titulo className={styles['titulo']}>{video.title}</Titulo>

          <p className={styles['meta']}>
            <PublishedDate fecha={video.published_at} />
            {duracion !== null && <span>{duracion}</span>}
          </p>

          {video.summary !== null && <p className={styles['resumen']}>{video.summary}</p>}

          <div className={[styles['acciones'], styles['pie']].join(' ')}>
            {embed !== null && !reproduciendo && (
              <Button
                variant="secondary"
                onClick={() => {
                  setReproduciendo(true);
                }}
              >
                Reproducir
              </Button>
            )}
            {video.video_url !== null && (
              <ExternalLink href={video.video_url}>
                {proveedor !== null ? `Ver en ${proveedor}` : 'Ver el video'}
              </ExternalLink>
            )}
          </div>

          <TagLinks seccion={RUTAS.videos} tags={video.tags} />
        </article>
      </Card>
    </li>
  );
}
