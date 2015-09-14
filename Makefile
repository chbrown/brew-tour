all: static/site.css static/img/favicon.ico

%.css: %.less
	lessc $< | cleancss --keep-line-breaks --skip-advanced -o $@

static/img/favicon-%.png: static/img/favicon.png
	convert $^ -resize $*x$* $@.tmp
	pngcrush -q $@.tmp $@
	rm $@.tmp

static/img/favicon.ico: static/img/favicon-16.png static/img/favicon-32.png
	convert $^ $@
