all: static/img/favicon.ico

static/img/favicon-%.png: static/img/favicon.png
	convert $^ -resize $*x$* $@.tmp
	pngcrush -q $@.tmp $@
	rm $@.tmp

static/img/favicon.ico: static/img/favicon-16.png static/img/favicon-32.png
	convert $^ $@
