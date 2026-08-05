# Makefile for compiling the user guide

# Configuration
PANDOC = pandoc
METADATA = metadata.yaml
CHAPTERS = $(wildcard chapters/*.md)
OUTPUT = user_guide.pdf

# PDF conversion flags
FLAGS = --toc \
        --number-sections \
        --pdf-engine=pdflatex

all: $(OUTPUT)

$(OUTPUT): $(METADATA) $(CHAPTERS)
	$(PANDOC) $(METADATA) $(CHAPTERS) -o $(OUTPUT) $(FLAGS)

clean:
	rm -f $(OUTPUT)

.PHONY: all clean
